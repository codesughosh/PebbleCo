import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import paymentRoutes from "./routes/payment.js";
import verifyRoutes from "./routes/verify.js";
import billingInvoiceRoutes from "./routes/billingInvoice.js";

dotenv.config();
console.log("RZP KEY:", process.env.RAZORPAY_KEY_ID);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("PebbleCo Backend Running");
});

const PORT = process.env.PORT || 5000;
app.use("/api", paymentRoutes);
app.use("/api", verifyRoutes);
app.use("/api", billingInvoiceRoutes);
app.use("/api/admin", adminOrdersRoutes);
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
