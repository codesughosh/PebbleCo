import express from "express";
import crypto from "crypto";
import { supabase } from "../supabase.js";
import { verifyFirebaseUser } from "../middleware/auth.js";
import { createShiprocketOrder } from "../services/createShiprocketOrder.js";
import { sendOrderEmail } from "../utils/sendOrderEmail.js";
import { sendTelegramOrderNotification } from "../utils/sendTelegramOrderNotification.js";
import { calculateOrderItemsTotal } from "../utils/checkout.js";

const router = express.Router();

function signaturesMatch(expectedSignature, receivedSignature) {
  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(String(receivedSignature || ""), "hex");

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
}

router.post("/verify-payment", verifyFirebaseUser, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;
  const userId = req.user.uid;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !orderId
  ) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (!signaturesMatch(expectedSignature, razorpay_signature)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  }

  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", userId)
      .single();

    if (orderError || !order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.razorpay_order_id !== razorpay_order_id) {
      return res
        .status(400)
        .json({ success: false, message: "Payment does not match order" });
    }

    const alreadySuccess = order.payment_status === "success";

    let confirmedTotal = Number(order.total);

    if (!alreadySuccess) {
      const { data: pendingItems, error: pendingError } = await supabase
        .from("pending_order_items")
        .select("quantity, price_at_purchase, product:products(name, price)")
        .eq("order_id", orderId);

      if (pendingError) {
        console.error("Error fetching pending_order_items:", pendingError);
        throw new Error("Failed to fetch pending order items");
      }

      if (!pendingItems || pendingItems.length === 0) {
        throw new Error("Pending order items missing");
      }

      const computedTotal = calculateOrderItemsTotal(
        pendingItems,
        order.delivery_type,
      );
      confirmedTotal = computedTotal;

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "paid",
          payment_status: "success",
          payment_id: razorpay_payment_id,
          total: computedTotal,
        })
        .eq("id", orderId)
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating order status:", updateError);
        throw updateError;
      }
    }

    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Error fetching order_items after payment:", itemsError);
      throw new Error("Failed to fetch order items after payment");
    }

    if (!orderItems || orderItems.length === 0) {
      throw new Error("Order items missing after payment");
    }

    if (order.customer_email && !alreadySuccess) {
      await sendOrderEmail({
        to: order.customer_email,
        customerName: order.customer_name || "Customer",
        orderId: order.id,
        total: confirmedTotal,
      });
    }

    if (!alreadySuccess) {
      try {
        await sendTelegramOrderNotification({
          order: {
            ...order,
            total: confirmedTotal,
            payment_status: "success",
            payment_id: razorpay_payment_id,
          },
          items: orderItems,
          paymentLabel: "Razorpay paid",
        });
      } catch (notifyError) {
        console.error("Razorpay Telegram notification failed:", notifyError);
      }
    }

    await supabase
      .from("orders")
      .delete()
      .eq("user_id", userId)
      .eq("status", "pending")
      .neq("id", orderId);

    const { error: cartError } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", userId);

    if (cartError) {
      console.error("Error clearing cart:", cartError);
      throw cartError;
    }

    if (order.delivery_type === "shipping" && order.shipping_address) {
      try {
        const shiprocketResponse = await createShiprocketOrder({
          orderId,
          customerName: order.customer_name || "Customer",
          customerPhone: order.customer_phone || "9999999999",
          shippingAddress: order.shipping_address,
          cartItems: orderItems,
        });

        await supabase
          .from("orders")
          .update({
            shiprocket_order_id: shiprocketResponse.order_id,
            awb_code: shiprocketResponse.awb_code,
            courier_name: shiprocketResponse.courier_name,
            shipment_status: "created",
          })
          .eq("id", orderId)
          .eq("user_id", userId);
      } catch (err) {
        console.error("Shiprocket failed:", err.response?.data || err.message);
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Verify payment error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Verification failed" });
  }
});

export default router;
