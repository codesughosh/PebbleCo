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

    const orderItems = cartItems.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      product_name: item.name, // ✅ FIX
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase ?? item.price,
    }));

    const { error: insertError } = await supabase
  .from("order_items")
  .insert(orderItems);

if (insertError) {
  throw insertError;
}


const computedTotal = cartItems.reduce(
  (sum, item) =>
    sum + item.quantity * (item.price_at_purchase ?? item.price),
  0
);

console.log("✅ Order items inserted:", orderItems);

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
  throw updateError;
}


    if (order.customer_email) {
      console.log("📧 Sending order email to:", order.customer_email);

      await sendOrderEmail({
        to: order.customer_email,
        customerName: customerName || "Customer",
        orderId: order.id,
        total: computedTotal,
      });
    } else {
      console.error("❌ No customer email found, email not sent");
    }

    // 🧹 CLEAN DUPLICATE PENDING ORDERS (same user)
    await supabase
      .from("orders")
      .delete()
      .eq("user_id", userId)
      .eq("status", "pending")
      .neq("id", orderId);


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
    // 1️⃣ Fetch order items from DB (single source of truth)
    const { data: dbOrderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError || !dbOrderItems || dbOrderItems.length === 0) {
      throw new Error("No order items found for Shiprocket");
    }

    const finalCustomerName = customerName || "Customer";

const finalCustomerPhone = customerPhone || "9999999999";


    // 2️⃣ Create Shiprocket order
    const shiprocketResponse = await createShiprocketOrder({
      orderId,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      shippingAddress: order.shipping_address,
      cartItems: dbOrderItems,
    });

    // 3️⃣ Save Shiprocket details
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
    console.error(
      "🚨 Shiprocket failed:",
      err.response?.data || err.message
    );
  }
}

// ✅ Final success response
return res.json({ success: true });

} catch (err) {
  console.error("❌ Verify error:", err);
  return res
    .status(500)
    .json({ success: false, message: "Verification failed" });
}
});

export default router;
