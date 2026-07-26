import express from "express";
import crypto from "crypto";
import { supabase } from "../supabase.js";
import { sendOrderEmail } from "../utils/sendOrderEmail.js";
import { createShiprocketOrder } from "../services/createShiprocketOrder.js";
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
        .select("quantity, price_at_purchase, product:products(price)")
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

      // Update order
      await supabase
        .from("orders")
        .update({
          status: "paid",
          payment_status: "success",
          payment_id: payment.id,
          total: verifiedTotal,
        })
        .eq("id", order.id);

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
