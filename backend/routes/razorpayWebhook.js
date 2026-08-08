/* global Buffer, process */
import express from "express";
import crypto from "crypto";
import { supabase } from "../supabase.js";
import { sendOrderEmail } from "../utils/sendOrderEmail.js";
import { sendTelegramOrderNotification } from "../utils/sendTelegramOrderNotification.js";
import { createShiprocketOrder } from "../services/createShiprocketOrder.js";
import { calculateOrderItemsTotal } from "../utils/checkout.js";
import {
  applyStockDecrementPlan,
  createStockDecrementPlan,
} from "../utils/inventory.js";

const router = express.Router();

function signaturesMatch(expectedSignature, receivedSignature) {
  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(String(receivedSignature || ""), "hex");

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
}

router.post("/razorpay-webhook", async (req, res) => {
  try {
    const body = JSON.parse(req.body.toString());

    console.log("Webhook hit:", body.event);
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (!secret || !signature) {
      return res.status(400).send("Missing webhook secret or signature");
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(req.body.toString())
      .digest("hex");

    if (!signaturesMatch(expected, signature)) {
      return res.status(401).send("Invalid signature");
    }

    const event = body.event;
    const payment = body.payload?.payment?.entity;

    if (event === "payment.captured" && payment) {
      const razorpayOrderId = payment.order_id;

      // Find order using razorpay_order_id
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("razorpay_order_id", razorpayOrderId)
        .single();

      if (error || !order) {
        console.warn("Order not found for webhook:", razorpayOrderId);
        return res.send("OK");
      }

      // Prevent double processing
      if (order.payment_status === "success") {
        return res.send("Already processed");
      }

      const { data: pendingItems, error: pendingError } = await supabase
        .from("pending_order_items")
        .select(
          "product_id, product_name, quantity, price_at_purchase, product:products(id, name, price)",
        )
        .eq("order_id", order.id);

      if (pendingError) {
        console.error("Webhook pending item fetch failed:", pendingError);
        return res.status(500).send("Unable to verify order items");
      }

      const verifiedTotal =
        pendingItems && pendingItems.length > 0
          ? calculateOrderItemsTotal(pendingItems, order.delivery_type)
          : Number(order.total);
      const expectedAmount = Math.round(verifiedTotal * 100);

      if (
        payment.currency !== "INR" ||
        !Number.isFinite(expectedAmount) ||
        Number(payment.amount) !== expectedAmount
      ) {
        console.error("Webhook payment amount mismatch:", {
          orderId: order.id,
          expectedAmount,
          receivedAmount: payment.amount,
          currency: payment.currency,
        });
        return res.status(400).send("Payment amount mismatch");
      }

      let stockItems = pendingItems;
      if (!stockItems || stockItems.length === 0) {
        const { data: existingItems, error: existingItemsError } = await supabase
          .from("order_items")
          .select("product_id, product_name, quantity")
          .eq("order_id", order.id);

        if (existingItemsError) {
          console.error("Webhook existing item fetch failed:", existingItemsError);
          return res.status(500).send("Unable to verify order stock");
        }

        stockItems = existingItems;
      }

      const stockPlan = await createStockDecrementPlan(supabase, stockItems);

      // Update order
      const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update({
          status: "paid",
          payment_status: "success",
          payment_id: payment.id,
          total: verifiedTotal,
        })
        .eq("id", order.id)
        .neq("payment_status", "success")
        .select("id")
        .maybeSingle();

      if (updateError) {
        console.error("Webhook order status update failed:", updateError);
        return res.status(500).send("Unable to update order status");
      }

      if (!updatedOrder) {
        return res.send("Already processed");
      }

      try {
        await applyStockDecrementPlan(supabase, stockPlan);
      } catch (inventoryError) {
        await supabase
          .from("orders")
          .update({
            status: "pending",
            payment_status: "pending",
            payment_id: null,
          })
          .eq("id", order.id)
          .eq("payment_status", "success")
          .eq("payment_id", payment.id);

        throw inventoryError;
      }

      // Clear cart for user (in case frontend never returned)
      if (order.user_id) {
        await supabase.from("cart").delete().eq("user_id", order.user_id);
      }

      // Send email
      if (order.customer_email) {
        await sendOrderEmail({
          to: order.customer_email,
          customerName: order.customer_name || "Customer",
          orderId: order.id,
          total: verifiedTotal,
        });
      }

      const { data: notificationItems } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      try {
        await sendTelegramOrderNotification({
          order: {
            ...order,
            total: verifiedTotal,
            payment_status: "success",
            payment_id: payment.id,
          },
          items:
            notificationItems && notificationItems.length > 0
              ? notificationItems
              : pendingItems,
          paymentLabel: "Razorpay paid",
        });
      } catch (notifyError) {
        console.error("Webhook Telegram notification failed:", notifyError);
      }

      // Create Shiprocket order (only for shipping)
      if (order.delivery_type === "shipping" && order.shipping_address) {
        const { data: dbItems } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id);

        if (dbItems && dbItems.length > 0) {
          try {
            const finalName = order.customer_name || "Customer";
            const finalPhone = order.customer_phone || "9999999999";

            const shiprocketResponse = await createShiprocketOrder({
              orderId: order.id,
              customerName: finalName,
              customerPhone: finalPhone,
              shippingAddress: order.shipping_address,
              cartItems: dbItems,
            });

            await supabase
              .from("orders")
              .update({
                shiprocket_order_id: shiprocketResponse.order_id,
                awb_code: shiprocketResponse.awb_code,
                courier_name: shiprocketResponse.courier_name,
                shipment_status: "created",
              })
              .eq("id", order.id);
          } catch (err) {
            console.error("Shiprocket webhook error:", err.message);
          }
        }
      }
    }

    res.send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook failed");
  }
});

export default router;
