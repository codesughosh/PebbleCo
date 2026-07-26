import express from "express";
import { supabase } from "../supabase.js";
import { sendOrderEmail } from "../utils/sendOrderEmail.js";
import { verifyAdmin } from "../middleware/adminAuth.js";
const router = express.Router();

/* Get all orders */
router.get("/orders", verifyAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (*)
    `)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json(error);
  res.json(data);
});

router.patch("/orders/:id", verifyAdmin, async (req, res) => {
  const { status, payment_status, shipment_status, awb_code, courier_name } =
    req.body;

  // 1️⃣ Get existing order (needed for email)
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("customer_email, customer_name, delivery_type, total, payment_status")
    .eq("id", req.params.id)
    .single();

  if (fetchError || !order) {
    return res.status(404).json({ error: "Order not found" });
  }

  // 2️⃣ Update order
  const updates = {};

  if (status !== undefined) updates.status = status;
  if (payment_status !== undefined) updates.payment_status = payment_status;
  if (shipment_status !== undefined) updates.shipment_status = shipment_status;
  if (awb_code !== undefined) updates.awb_code = awb_code;
  if (courier_name !== undefined) updates.courier_name = courier_name;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No updates provided" });
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", req.params.id);

  if (updateError) {
    return res.status(500).json(updateError);
  }

  // Send confirmation email when manual payment is verified.
  let confirmationEmailSent = false;
  let confirmationEmailError = null;

  const shouldSendPaymentConfirmation =
    payment_status === "success" && order.payment_status !== "success";

  if (shouldSendPaymentConfirmation && !order.customer_email) {
    confirmationEmailError = "Order updated, but customer email is missing";
  }

  if (shouldSendPaymentConfirmation && order.customer_email) {
    try {
      await sendOrderEmail({
        to: order.customer_email,
        customerName: order.customer_name || "Customer",
        orderId: req.params.id,
        total: order.total,
        deliveryType: order.delivery_type,
        type: "confirmed",
      });
      confirmationEmailSent = true;
    } catch (err) {
      confirmationEmailError = "Order updated, but confirmation email failed";
      console.error("Manual payment confirmation email failed:", err);
    }
  }

  // Send a delivery email when the admin marks the order delivered.
  if (status === "delivered") {
    await sendOrderEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      orderId: req.params.id,
      total: order.total,
      deliveryType: order.delivery_type,
      type: "delivered",
    });
  }

  res.json({
    success: true,
    confirmationEmailSent,
    confirmationEmailError,
  });
});


export default router;
