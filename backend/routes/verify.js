import express from "express";
import crypto from "crypto";
import { supabase } from "../supabase.js";
import { createShiprocketOrder } from "../services/createShiprocketOrder.js";
import { sendOrderEmail } from "../utils/sendOrderEmail.js";
const router = express.Router();

router.post("/verify-payment", async (req, res) => {
  console.log("🔔 Verify payment API hit");
  console.log("VERIFY BODY:", req.body);

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
    userId,
    cartItems,
    deliveryType,
    customerName,
    customerPhone,
  } = req.body;

  // 🔒 BASIC VALIDATION
  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !orderId ||
    !userId ||
    !cartItems ||
    cartItems.length === 0
  ) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  // 🔐 SIGNATURE VERIFICATION
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  if (expectedSignature !== razorpay_signature) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  }

  // ✅ Extra validation for in-hand delivery
  if (deliveryType === "inhand") {
    if (!customerName || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: "Missing in-hand customer details",
      });
    }
  }

  try {
    // ✅ 1. Confirm order exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();
    if (orderError || !order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // If already marked as paid, skip updating and simply proceed
    const alreadySuccess = order.payment_status === "success";
    if (!alreadySuccess) {
      // 🔒 Verify pending_order_items exist (ensures valid cart)
      const { data: pendingItems, error: pendingError } = await supabase
        .from("pending_order_items")
        .select("*")
        .eq("order_id", orderId);
      if (pendingError) {
        console.error("❌ Error fetching pending_order_items:", pendingError);
        throw new Error("Failed to fetch pending order items");
      }
      if (!pendingItems || pendingItems.length === 0) {
        console.error(`❌ No pending_order_items for order ${orderId}`);
        throw new Error("Pending order items missing — cannot proceed");
      }

      // Compute total from cart items (for record)
      const computedTotal = cartItems.reduce(
        (sum, item) =>
          sum + item.quantity * (item.price_at_purchase ?? item.price),
        0
      );

      // ✅ 2. Update order status to paid/success (fires trigger to move items)
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "paid",
          payment_status: "success",
          payment_id: razorpay_payment_id,
          total: computedTotal,
          customer_name: customerName,
          customer_phone: customerPhone,
        })
        .eq("id", orderId);
      if (updateError) {
        console.error("❌ Error updating order status:", updateError);
        throw updateError;
      }
      console.log(`✅ Order ${orderId} marked as paid`);
    } else {
      console.log(`ℹ️ Order ${orderId} was already paid; skipping update`);
    }

    // ✅ 3. Verify order_items moved by trigger
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);
    if (itemsError) {
      console.error("❌ Error fetching order_items after payment:", itemsError);
      throw new Error("Failed to fetch order items after payment");
    }
    if (!orderItems || orderItems.length === 0) {
      console.error(
        `❌ No order_items found for order ${orderId} after payment`
      );
      throw new Error(
        "Order items missing after payment - trigger might have failed"
      );
    }
    console.log(`✅ Found ${orderItems.length} order_items for order ${orderId}`);

    // ✅ 4. Send confirmation email if email exists
    if (order.customer_email) {
      console.log("📧 Sending order email to:", order.customer_email);
      // Use stored total or compute if not set
      const totalToEmail =
        order.total ??
        cartItems.reduce(
          (sum, item) =>
            sum + item.quantity * (item.price_at_purchase ?? item.price),
          0
        );
      await sendOrderEmail({
        to: order.customer_email,
        customerName: customerName || "Customer",
        orderId: order.id,
        total: totalToEmail,
      });
    } else {
      console.error("❌ No customer email found, email not sent");
    }

    // 🧹 CLEAN DUPLICATE PENDING ORDERS (same user, if any)
    await supabase
      .from("orders")
      .delete()
      .eq("user_id", userId)
      .eq("status", "pending")
      .neq("id", orderId);

    // ✅ 5. Clear cart
    const { error: cartError } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", userId);
    if (cartError) {
      console.error("❌ Error clearing cart:", cartError);
      throw cartError;
    }

    // 🚚 6. Create Shiprocket order (only for shipping)
    if (order.delivery_type === "shipping" && order.shipping_address) {
      try {
        const finalCustomerName =
          customerName || order.customer_name || "Customer";
        const finalCustomerPhone =
          customerPhone || order.customer_phone || "9999999999";

        const shiprocketResponse = await createShiprocketOrder({
          orderId,
          customerName: finalCustomerName,
          customerPhone: finalCustomerPhone,
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
          .eq("id", orderId);
        console.log(
          `🚚 Shiprocket order created: ${shiprocketResponse.order_id}`
        );
      } catch (err) {
        console.error(
          "🚨 Shiprocket failed:",
          err.response?.data || err.message
        );
      }
    }

    // ✅ Final success response
    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Verify payment error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Verification failed" });
  }
});

export default router;
