import express from "express";
import { supabase } from "../supabase.js";
import { generateInvoicePDF } from "../utils/generateInvoice.js";
import verifyUser from "../middleware/verifyUser.js";

const router = express.Router();

router.get("/invoice/:orderId", verifyUser, async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.uid;

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, payment_id, total, delivery_type, shipping_address, customer_name, customer_phone",
    )
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (error || !order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("quantity, price_at_purchase, products(name)")
    .eq("order_id", orderId);

  if (itemsError || !Array.isArray(items)) {
    return res.status(500).json({ error: "Could not load invoice items" });
  }

  const formattedItems = items.map((i) => ({
    name: i.products.name,
    quantity: i.quantity,
    price_at_purchase: i.price_at_purchase,
  }));

  const doc = generateInvoicePDF({
    orderId: order.id,
    paymentId: order.payment_id || "N/A",
    userEmail: order.shipping_address?.email || "N/A",
    items: formattedItems,
    total: order.total,
    deliveryType: order.delivery_type,
    shippingAddress: order.shipping_address,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=PebbleCo-Invoice-${orderId}.pdf`
  );

  doc.pipe(res);
});

export default router;
