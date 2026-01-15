import express from "express";
import { supabase } from "../supabase.js";
import { sendOrderEmail } from "../utils/sendOrderEmail.js";

const router = express.Router();

/* Get all orders */
router.get("/orders", async (req, res) => {
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

router.patch("/orders/:id", async (req, res) => {
  const { status, shipment_status, awb_code, courier_name } = req.body;

  // 1️⃣ Get existing order (needed for email)
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("customer_email, customer_name, delivery_type")
    .eq("id", req.params.id)
    .single();

  if (fetchError || !order) {
    return res.status(404).json({ error: "Order not found" });
  }

  // 2️⃣ Update order
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status,
      shipment_status,
      awb_code,
      courier_name,
    })
    .eq("id", req.params.id);

  if (updateError) {
    return res.status(500).json(updateError);
  }

  // 3️⃣ SEND EMAIL ONLY WHEN DELIVERED
  if (status === "delivered") {
    await sendOrderEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      orderId: req.params.id,
      deliveryType: order.delivery_type,
    });
  }

  res.json({ success: true });
});


export default router;
