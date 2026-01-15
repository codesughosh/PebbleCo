import express from "express";
import { supabase } from "../supabase.js";
import verifyUser from "../middleware/verifyUser.js";

const router = express.Router();

// Get single order (Order Success page)
router.get("/:orderId", verifyUser, async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.uid;

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
    .eq("user_id", userId)
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
