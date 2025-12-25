import express from "express";
import { generateInvoicePDF } from "../utils/generateInvoice.js";

const router = express.Router();

router.post("/billing-invoice", async (req, res) => {
  try {
    const { orderId, paymentId, userEmail, items, total } = req.body;

    const doc = generateInvoicePDF({
      orderId,
      paymentId,
      userEmail,
      items,
      total,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${orderId}.pdf`
    );

    doc.pipe(res);
  } catch (err) {
    console.error("Invoice PDF error:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
