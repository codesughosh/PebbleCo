import express from "express";
import razorpay from "../razorpay.js";
import { supabase } from "../supabase.js";

const router = express.Router();

router.post("/create-order", async (req, res) => {
  try {
    const {
      amount,
      userId,
      customerEmail,
      deliveryType,
      shippingAddress,
      inhandDetails,
      cartItems, // ✅ NEW
    } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1️⃣ Create DB order first (Supabase)
    const { data: dbOrder, error } = await supabase
      .from("orders")
      .insert([
        {
          user_id: userId,
          total: amount,
          customer_email: customerEmail,
          delivery_type: deliveryType,
          shipping_address: shippingAddress ?? null,
          payment_status: "pending",
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("DB order insert failed:", error);
      return res.status(500).json({ error: "DB order creation failed" });
    }

    // 1.5️⃣ Insert order items immediately (before payment)
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const orderItems = cartItems.map((item) => ({
      order_id: dbOrder.id,
      product_id: item.product_id,
      product_name: item.name,
      quantity: item.quantity,
      price_at_purchase: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items insert failed:", itemsError);
      return res.status(500).json({ error: "Failed to insert order items" });
    }

    // 2️⃣ Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // INR → paise
      currency: "INR",
      receipt: dbOrder.id.slice(0, 40),
    });

    // 2.5️⃣ Save Razorpay order ID in DB
    await supabase
      .from("orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", dbOrder.id);

    // 3️⃣ Respond with BOTH IDs
    res.json({
      orderId: razorpayOrder.id, // Razorpay order id
      dbOrderId: dbOrder.id, // Supabase orders UUID
      amount: razorpayOrder.amount,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

export default router;
