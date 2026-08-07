import express from "express";
import { supabase } from "../supabase.js";
import { sendOrderEmail } from "../utils/sendOrderEmail.js";
import { verifyAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

const ALLOWED_ORDER_STATUSES = new Set([
  "pending",
  "paid",
  "packed",
  "shipped",
  "delivered",
]);
const ALLOWED_PAYMENT_STATUSES = new Set([
  "pending",
  "pending_verification",
  "success",
  "rejected",
]);
const ALLOWED_SHIPMENT_STATUSES = new Set([
  "",
  null,
  "created",
  "picked",
  "in_transit",
  "delivered",
]);

function isAllowedStatus(value, allowedValues) {
  return value === undefined || allowedValues.has(value);
}

router.get("/orders", verifyAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (*)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json(error);
  res.json(data);
});

router.patch("/orders/:id", verifyAdmin, async (req, res) => {
  const { status, payment_status, shipment_status, awb_code, courier_name } =
    req.body;

  if (!isAllowedStatus(status, ALLOWED_ORDER_STATUSES)) {
    return res.status(400).json({ error: "Invalid order status" });
  }

  if (!isAllowedStatus(payment_status, ALLOWED_PAYMENT_STATUSES)) {
    return res.status(400).json({ error: "Invalid payment status" });
  }

  if (!isAllowedStatus(shipment_status, ALLOWED_SHIPMENT_STATUSES)) {
    return res.status(400).json({ error: "Invalid shipment status" });
  }

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("customer_email, customer_name, delivery_type, total, payment_status")
    .eq("id", req.params.id)
    .single();

  if (fetchError || !order) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (payment_status === "success" && order.payment_status !== "success") {
    return res.status(409).json({
      error: "Use the Telegram verify button to confirm UPI payments.",
    });
  }

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

  if (status === "delivered" && order.customer_email) {
    await sendOrderEmail({
      to: order.customer_email,
      customerName: order.customer_name || "Customer",
      orderId: req.params.id,
      total: order.total,
      deliveryType: order.delivery_type,
      type: "delivered",
    });
  }

  res.json({ success: true });
});

export default router;
