import express from "express";
import razorpay from "../razorpay.js";
import { supabase } from "../supabase.js";
import { verifyFirebaseUser } from "../middleware/auth.js";
import {
  CheckoutError,
  assertUniquePaymentId,
  buildOrderItems,
  calculateCheckoutTotal,
  fetchCheckoutCart,
  normalizeDeliveryDetails,
  normalizeUpiTransactionId,
} from "../utils/checkout.js";
import { sendTelegramOrderNotification } from "../utils/sendTelegramOrderNotification.js";

const router = express.Router();

function handleCheckoutError(res, err, fallbackMessage) {
  if (err instanceof CheckoutError) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error(fallbackMessage, err);
  return res.status(500).json({ error: fallbackMessage });
}

router.post("/create-order", verifyFirebaseUser, async (req, res) => {
  try {
    const { deliveryType, shippingAddress, inhandDetails } = req.body;
    const userId = req.user.uid;
    const email = req.user.email;
    const deliveryDetails = normalizeDeliveryDetails({
      deliveryType,
      shippingAddress,
      inhandDetails,
    });
    const cartItems = await fetchCheckoutCart(supabase, userId);
    const total = calculateCheckoutTotal(cartItems, deliveryType);

    const { data: dbOrder, error } = await supabase
      .from("orders")
      .insert([
        {
          user_id: userId,
          total,
          customer_email: email,
          customer_name: deliveryDetails.customerName,
          customer_phone: deliveryDetails.customerPhone,
          delivery_type: deliveryDetails.deliveryType,
          shipping_address: deliveryDetails.shippingAddress,
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
      await supabase.from("orders").delete().eq("id", dbOrder.id);
      return res.status(500).json({ error: "Failed to insert order items" });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
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
    return handleCheckoutError(res, err, "Failed to create order");
  }
});

router.post("/manual-upi-order", verifyFirebaseUser, async (req, res) => {
  try {
    const {
      deliveryType,
      shippingAddress,
      inhandDetails,
      upiTransactionId,
    } = req.body;

    const userId = req.user.uid;
    const email = req.user.email;
    const transactionId = normalizeUpiTransactionId(upiTransactionId);

    await assertUniquePaymentId(supabase, transactionId);

    const deliveryDetails = normalizeDeliveryDetails({
      deliveryType,
      shippingAddress,
      inhandDetails,
    });
    const cartItems = await fetchCheckoutCart(supabase, userId);
    const total = calculateCheckoutTotal(cartItems, deliveryType);

    const { data: dbOrder, error } = await supabase
      .from("orders")
      .insert([
        {
          user_id: userId,
          total,
          customer_email: email,
          customer_name: deliveryDetails.customerName,
          customer_phone: deliveryDetails.customerPhone,
          delivery_type: deliveryDetails.deliveryType,
          shipping_address: deliveryDetails.shippingAddress,
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

    try {
      await sendTelegramOrderNotification({
        order: dbOrder,
        items: buildOrderItems(dbOrder.id, cartItems),
        paymentLabel: "UPI pending verification",
        includeVerifyButton: true,
      });
    } catch (notifyError) {
      console.error("Manual UPI Telegram notification failed:", notifyError);
    }

    res.json({
      success: true,
      dbOrderId: dbOrder.id,
      paymentStatus: "pending_verification",
    });
  } catch (err) {
    return handleCheckoutError(res, err, "Failed to create manual UPI order");
  }
});

export default router;
