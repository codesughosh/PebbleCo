import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import paymentRoutes from "./routes/payment.js";
import verifyRoutes from "./routes/verify.js";
import billingInvoiceRoutes from "./routes/billingInvoice.js";
import adminOrdersRoutes from "./routes/adminOrders.js";
import { sendOrderEmail } from "./utils/sendOrderEmail.js";
import trackingRoutes from "./routes/tracking.js";
import { createClient } from "@supabase/supabase-js";
import { verifyFirebaseUser } from "./middleware/auth.js";
import cartRoutes from "./routes/cart.js";
import ordersRoutes from "./routes/orders.js";
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


dotenv.config();
console.log("RZP KEY:", process.env.RAZORPAY_KEY_ID);

const app = express();
app.use(cors({
  origin: [
    "https://pebbleco.shop",
    "https://www.pebbleco.shop"
  ],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
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
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api", paymentRoutes);
app.use("/api", verifyRoutes);
app.use("/api", billingInvoiceRoutes);
app.use("/api/admin", adminOrdersRoutes);
app.use("/api", trackingRoutes);

app.post("/api/reviews", verifyFirebaseUser, async (req, res) => {
  const { product_id, rating, comment } = req.body;
  const user = req.user;

  const { error } = await supabaseAdmin.from("reviews").insert({
    product_id,
    rating,
    comment,
    username: user.name || user.email,
    user_email: user.email,
  });

  if (error) {
    return res.status(500).json({ error: "Failed to submit review" });
  }

  res.json({ success: true });
});

app.delete("/api/reviews/:id", verifyFirebaseUser, async (req, res) => {
  const reviewId = req.params.id;
  const user = req.user;

  const { error } = await supabaseAdmin
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_email", user.email);

  if (error) {
    return res.status(403).json({ error: "Not allowed" });
  }

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
