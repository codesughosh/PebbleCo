import express from "express";
import { supabase } from "../supabase.js";
import { getShiprocketTracking } from "../services/shiprocketTracking.js";

const router = express.Router();

router.get("/track/:orderId", async (req, res) => {
  const { orderId } = req.params;

  const { data: order, error } = await supabase
    .from("orders")
    .select("awb_code, shipment_status")
    .eq("id", orderId)
    .single();

  if (error || !order || !order.awb_code) {
    return res.status(404).json({
      success: false,
      message: "Tracking not available yet",
    });
  }

  try {
    const tracking = await getShiprocketTracking(order.awb_code);

    // Optional: sync latest status
    const latestStatus =
      tracking?.tracking_data?.shipment_status || order.shipment_status;

    await supabase
      .from("orders")
      .update({ shipment_status: latestStatus })
      .eq("id", orderId);

    return res.json({
      success: true,
      tracking,
    });
  } catch (err) {
    console.error("Tracking failed:", err.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch tracking",
    });
  }
});

export default router;
