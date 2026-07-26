import express from "express";
import razorpay from "../razorpay.js";
import { supabase } from "../supabase.js";
import { verifyFirebaseUser } from "../middleware/auth.js";

const router = express.Router();

function buildOrderItems(orderId, cartItems) {
  return cartItems.map((item) => ({
    order_id: orderId,
    product_id: item.product_id,
    product_name: item.name,
    quantity: item.quantity,
    price_at_purchase: item.price,
  }));
}

function hasValidCart(cartItems) {
  return Array.isArray(cartItems) && cartItems.length > 0;
}

router.post("/create-order", async (req, res) => {
  try {
    const {
      amount,
      userId,
      customerEmail,
      deliveryType,
      shippingAddress,
      cartItems,
    } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!hasValidCart(cartItems)) {
      return res.status(400).json({ error: "Cart is empty" });
    }

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

    const { error: itemsError } = await supabase
      .from("pending_order_items")
      .upsert(buildOrderItems(dbOrder.id, cartItems), {
        onConflict: "order_id,product_id",
      });

    if (itemsError) {
      console.error("Order items insert failed:", itemsError);
      return res.status(500).json({ error: "Failed to insert order items" });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: dbOrder.id.slice(0, 40),
    });

    await supabase
      .from("orders")
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq("id", dbOrder.id);

    res.json({
      orderId: razorpayOrder.id,
      dbOrderId: dbOrder.id,
      amount: razorpayOrder.amount,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.post("/manual-upi-order", verifyFirebaseUser, async (req, res) => {
  try {
    const {
      amount,
      customerEmail,
      deliveryType,
      shippingAddress,
      inhandDetails,
      cartItems,
      upiTransactionId,
    } = req.body;

    const userId = req.user.uid;
    const email = req.user.email || customerEmail;
    const transactionId = String(upiTransactionId || "").trim();

    if (!amount || !userId || !deliveryType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!hasValidCart(cartItems)) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    if (transactionId.length < 6 || transactionId.length > 80) {
      return res.status(400).json({ error: "Invalid UPI transaction ID" });
    }

    const customerName =
      deliveryType === "inhand" ? inhandDetails?.name : shippingAddress?.name;
    const customerPhone =
      deliveryType === "inhand" ? inhandDetails?.phone : shippingAddress?.phone;

    const { data: dbOrder, error } = await supabase
      .from("orders")
      .insert([
        {
          user_id: userId,
          total: amount,
          customer_email: email,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          delivery_type: deliveryType,
          shipping_address: deliveryType === "shipping" ? shippingAddress : null,
          payment_status: "pending_verification",
          status: "pending",
          payment_id: transactionId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Manual UPI order insert failed:", error);
      return res.status(500).json({ error: "Order creation failed" });
    }

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(buildOrderItems(dbOrder.id, cartItems));

    if (itemsError) {
      console.error("Manual UPI order items insert failed:", itemsError);
      await supabase.from("orders").delete().eq("id", dbOrder.id);
      return res.status(500).json({ error: "Failed to insert order items" });
    }

    const { error: cartError } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", userId);

    if (cartError) {
      console.error("Manual UPI cart clear failed:", cartError);
    }

    res.json({
      success: true,
      dbOrderId: dbOrder.id,
      paymentStatus: "pending_verification",
    });
  } catch (err) {
    console.error("Manual UPI order error:", err);
    res.status(500).json({ error: "Failed to create manual UPI order" });
  }
});

export default router;
