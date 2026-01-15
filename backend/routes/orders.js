import express from "express";
import { supabase } from "../supabase.js";
import verifyUser from "../middleware/verifyUser.js";

const router = express.Router();

// Get logged-in user's orders
router.get("/", verifyUser, async (req, res) => {
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
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ orders: data });
});

export default router;
