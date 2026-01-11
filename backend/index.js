import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import paymentRoutes from "./routes/payment.js";
import verifyRoutes from "./routes/verify.js";
import billingInvoiceRoutes from "./routes/billingInvoice.js";
import adminOrdersRoutes from "./routes/adminOrders.js";
import { sendOrderEmail } from "./utils/sendOrderEmail.js";
import trackingRoutes from "./routes/tracking.js";

dotenv.config();
console.log("RZP KEY:", process.env.RAZORPAY_KEY_ID);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("PebbleCo Backend Running");
});

app.get("/test-order-email", async (req, res) => {
  try {
    await sendOrderEmail({
      to: "pebbleco.team@gmail.com",
      customerName: "Test Customer",
      orderId: "PC-TEST-001",
      total: 999
    });

    res.send("Test order email sent");
  } catch (err) {
    console.error(err);
    res.status(500).send("Email failed");
  }
});

const PORT = process.env.PORT || 5000;
app.use("/api", paymentRoutes);
app.use("/api", verifyRoutes);
app.use("/api", billingInvoiceRoutes);
app.use("/api/admin", adminOrdersRoutes);
app.use("/api", trackingRoutes);
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
