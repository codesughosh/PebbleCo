router.get("/track/:orderId", async (req, res) => {
  const { orderId } = req.params;

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, delivery_type, status, awb_code, shipment_status"
    )
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  const deliveryType = String(order.delivery_type || "").toLowerCase();

  // ✅ CASE 1: IN-HAND DELIVERY (NO AWB REQUIRED)
  if (
    deliveryType === "inhand" ||
    deliveryType === "in_hand" ||
    deliveryType === "in hand"
  ) {
    return res.json({
      success: true,
      type: "inhand",
      tracking: {
        status: order.status || "confirmed",
      },
    });
  }

  // ✅ CASE 2: SHIPPING BUT NOT SHIPPED YET
  if (!order.awb_code) {
    return res.json({
      success: true,
      type: "shipping",
      tracking: {
        status: order.status || "packed",
        message: "Preparing shipment",
      },
    });
  }

  // ✅ CASE 3: SHIPPING WITH AWB
  try {
    const tracking = await getShiprocketTracking(order.awb_code);

    const latestStatus =
      tracking?.tracking_data?.shipment_status || order.shipment_status;

    await supabase
      .from("orders")
      .update({ shipment_status: latestStatus })
      .eq("id", orderId);

    return res.json({
      success: true,
      type: "shipping",
      tracking,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch tracking",
    });
  }
});

export default router;
