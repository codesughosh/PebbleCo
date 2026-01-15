import express from "express";
import razorpay from "../razorpay.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

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
    } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1️⃣ Create DB order first (Supabase)
    const { data: dbOrder, error } = await supabaseAdmin
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

    // 2️⃣ Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // INR → paise
      currency: "INR",
      receipt: `pebbleco_${dbOrder.id}`,
    });

    // 3️⃣ Respond with BOTH IDs
    res.json({
      orderId: razorpayOrder.id, // Razorpay order id
      dbOrderId: dbOrder.id,     // Supabase orders UUID
      amount: razorpayOrder.amount,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

export default router;
