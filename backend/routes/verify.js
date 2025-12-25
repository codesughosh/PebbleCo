import express from "express";
import crypto from "crypto";
import { supabase } from "../supabase.js";
import { createShiprocketOrder } from "../services/createShiprocketOrder.js";

const router = express.Router();

router.post("/verify-payment", async (req, res) => {
  console.log("🔔 Verify payment API hit");

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
    cartItems,
    userId,
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

    // ✅ 2. Insert order items
    const orderItems = cartItems.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase ?? item.price,
    }));

    const { data, error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems)
      .select();

    console.log("ORDER ITEMS INSERT:", data, itemsError);

    // ✅ 3. Update order
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_status: "success",
        payment_id: razorpay_payment_id,
      })
      .eq("id", orderId);

    // 🧹 CLEAN DUPLICATE PENDING ORDERS (same user)
    await supabase
      .from("orders")
      .delete()
      .eq("user_id", userId)
      .eq("status", "pending")
      .neq("id", orderId);

    if (updateError) {
      throw updateError;
    }

    // ✅ 4. Clear cart
    const { error: cartError } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", userId);

    if (cartError) {
      throw cartError;
    }

    // 🚚 Create Shiprocket order (only for shipping)
    if (order.delivery_type === "shipping" && order.shipping_address) {
      try {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId);

        const shiprocketResponse = await createShiprocketOrder({
          order,
          orderItems,
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
      } catch (err) {
        console.error("🚨 Shiprocket failed:", err.message);
        // DO NOT throw
      }
    }

    // 🎉 DONE
    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Verify error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Verification failed" });
  }
});

export default router;
