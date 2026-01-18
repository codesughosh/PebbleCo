import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// =======================
// CONFIG
// =======================
const DAYS_BACK = 7; // how many days of payments to scan
const DRY_RUN = false; // set true to preview without updating DB

// =======================
// CLIENTS
// =======================
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =======================
// HELPERS
// =======================
function daysAgoTimestamp(days) {
  return Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
}

// =======================
// MAIN
// =======================
async function run() {
  console.log("🔎 Starting PebbleCo payment reconciliation");
  console.log(`Looking back ${DAYS_BACK} days`);
  console.log(`DRY RUN: ${DRY_RUN}`);

  let from = daysAgoTimestamp(DAYS_BACK);
  let skip = 0;
  let fixedCount = 0;
  let unmatched = [];

  while (true) {
    const response = await razorpay.payments.all({
      from,
      count: 100,
      skip,
    });

    const payments = response.items;
    if (!payments || payments.length === 0) break;

    for (const payment of payments) {
      if (payment.status !== "captured") continue;
      if (!payment.order_id) continue;

      // Find matching order
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("razorpay_order_id", payment.order_id)
        .maybeSingle();

      if (!order) {
        unmatched.push(payment.id);
        continue;
      }

      if (order.payment_status === "success") {
        continue;
      }

      console.log(
        `⚡ Fixing order ${order.id} | Payment ${payment.id}`
      );

      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "paid",
            payment_status: "success",
            payment_id: payment.id,
          })
          .eq("id", order.id);

        if (updateError) {
          console.error(
            `❌ Failed to update order ${order.id}`,
            updateError
          );
        } else {
          fixedCount++;
        }
      }
    }

    skip += payments.length;
  }

  console.log("==================================");
  console.log("✅ Reconciliation complete");
  console.log(`Fixed orders: ${fixedCount}`);
  console.log(`Unmatched payments: ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log("Unmatched payment IDs:");
    unmatched.forEach((id) => console.log(" -", id));
  }
}

run().catch((err) => {
  console.error("Fatal error:", err);
});
