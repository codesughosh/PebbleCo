import express from "express";
import { supabase } from "../supabase.js";

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

/* Update order status */
router.patch("/orders/:id", async (req, res) => {
  const { status, shipment_status, awb_code, courier_name } = req.body;

  const { error } = await supabase
    .from("orders")
    .update({
      status,
      shipment_status,
      awb_code,
      courier_name,
    })
    .eq("id", req.params.id);

  if (error) return res.status(500).json(error);
  res.json({ success: true });
});

export default router;
