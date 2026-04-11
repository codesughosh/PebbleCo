import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
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
import razorpayWebhook from "./routes/razorpayWebhook.js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

dotenv.config();
console.log("RZP KEY:", process.env.RAZORPAY_KEY_ID);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(
  cors({
    origin: ["https://pebbleco.shop", "https://www.pebbleco.shop"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(
  "/api/razorpay-webhook",
  express.raw({ type: "*/*" })
);

app.use("/api", razorpayWebhook);

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
      total: 999,
    });

    res.send("Test order email sent");
  } catch (err) {
    console.error(err);
    res.status(500).send("Email failed");
  }
});

app.head("/health", (req, res) => {
  res.sendStatus(200);
});

app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

const PORT = process.env.PORT || 5000;
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api", paymentRoutes);
app.use("/api", verifyRoutes);
app.use("/api", billingInvoiceRoutes);
app.use("/api/admin", adminOrdersRoutes);
app.use("/api", trackingRoutes);
app.post(
  "/api/reviews",
  verifyFirebaseUser,
  upload.array("images", 3),
  async (req, res) => {
    try {
      const { product_id, rating, comment } = req.body;
      const user = req.user;

      if (!product_id || !rating || !comment) {
        return res.status(400).json({ error: "Missing fields" });
      }

      let imageUrls = [];

      // 📤 Upload each image
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const ext = file.originalname.split(".").pop();
          const fileName = `reviews/${uuidv4()}.${ext}`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from("review-images")
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
            });

          if (uploadError) {
            console.error("UPLOAD ERROR:", uploadError);
            return res.status(500).json({ error: "Image upload failed" });
          }

          const { data } = supabaseAdmin.storage
            .from("review-images")
            .getPublicUrl(fileName);

          imageUrls.push(data.publicUrl);
        }
      }

      // 📝 Save review in DB
      const { error } = await supabaseAdmin.from("reviews").insert({
        product_id,
        rating,
        comment,
        username: user.name || user.email,
        user_email: user.email,
        image_urls: imageUrls,
      });

      if (error) {
        console.error("DB ERROR:", error);
        return res.status(500).json({ error: "Failed to save review" });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("REVIEWS CRASH:", err);
      res.status(500).json({ error: "Server crash" });
    }
  },
);

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
