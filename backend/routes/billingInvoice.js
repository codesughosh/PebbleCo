import express from "express";
import { supabase } from "../supabase.js";
import { generateInvoicePDF } from "../utils/generateInvoice.js";

const router = express.Router();

router.get("/invoice/:orderId", async (req, res) => {
  const { orderId } = req.params;

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("quantity, price_at_purchase, products(name)")
    .eq("order_id", orderId);

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
