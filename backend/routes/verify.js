import express from "express";
import crypto from "crypto";

const router = express.Router();

router.post("/verify-payment", (req, res) => {
  console.log("🔔 Verify payment API hit");
  console.log("Request body:", req.body);

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    console.log("❌ Missing fields");
    return res.status(400).json({ success: false });
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  console.log("Expected signature:", expectedSignature);
  console.log("Received signature:", razorpay_signature);

  if (expectedSignature === razorpay_signature) {
    console.log("✅ Signature verified");
    return res.json({ success: true });
  } else {
    console.log("❌ Signature mismatch");
    return res.status(400).json({ success: false });
  }
});

export default router;
