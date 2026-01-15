import express from "express";
import { supabase } from "../supabase.js";
import verifyUser from "../middleware/verifyUser.js";

const router = express.Router();

/**
 * ===============================
 * GET /api/orders
 * → My Orders page
 * ===============================
 */
router.get("/", verifyUser, async (req, res) => {
  const userId = req.user.uid;

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      total,
      status,
      payment_status,
      delivery_type,
      created_at,
      order_items (
        quantity,
        price_at_purchase,
        products ( name )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }

  res.json({
    success: true,
    orders: data,
  });
});

/**
 * ==================================
 * GET /api/orders/:orderId
 * → Order Success page
 * ==================================
 */
router.get("/:orderId", async (req, res) => {
  const { orderId } = req.params;

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        quantity,
        price_at_purchase,
        products ( name )
      )
    `)
    .eq("id", orderId)
    .single();

  if (error || !data) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  res.json({
    success: true,
    order: data,
  });
});

export default router;
