import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// =======================
// CONFIG
// =======================
const DAYS_BACK = 7; // how many days of payments to scan
const DRY_RUN = false; // set true to preview without updating DB
const RATE_LIMIT_DELAY_MS = 200; // avoid Razorpay API rate limits

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
// HELPERS (UNCHANGED)
// =======================
function daysAgoTimestamp(days) {
  return Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  let recovered = 0;

  while (true) {
    const response = await razorpay.payments.all({
      from,
      count: 100,
      skip,
    });

    const payments = response.items;
    if (!payments || payments.length === 0) break;

    for (const payment of payments) {
      await sleep(RATE_LIMIT_DELAY_MS);

      if (payment.status !== "captured") continue;
      if (!payment.order_id) continue;

      // =======================
      // Find matching order
      // =======================
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("razorpay_order_id", payment.order_id)
        .maybeSingle();

      if (error) {
        console.error("❌ Supabase fetch error:", error);
        continue;
      }

      if (!order) {
        unmatched.push(payment.id);
        continue;
      }

      // =======================
      // Check if order_items exist (recovery mode)
      // =======================
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("id")
        .eq("order_id", order.id);

      if (itemsError) {
        console.error("❌ Failed checking order_items:", itemsError);
        continue;
      }

      const needsRecovery = !items || items.length === 0;

      // Skip clean, already-processed orders
      if (order.payment_status === "success" && !needsRecovery) {
        continue;
      }

      console.log(
        `⚡ Fixing order ${order.id} | Payment ${payment.id} | Recovery: ${needsRecovery}`
      );

      // =======================
      // OPTIONAL: Restore pending items from Razorpay notes (future-proof)
      // =======================
      if (needsRecovery) {
        try {
          const notes = payment.notes || {};
          if (notes.items) {
            const restoredItems = JSON.parse(notes.items);

            console.log(
              `🛠 Restoring ${restoredItems.length} items from Razorpay notes`
            );

            if (!DRY_RUN) {
              const rebuilt = restoredItems.map((item) => ({
                order_id: order.id,
                product_id: item.product_id,
                product_name: item.name,
                quantity: item.quantity,
                price_at_purchase:
                  item.price_at_purchase ?? item.price,
              }));

              const { error: rebuildError } = await supabase
                .from("pending_order_items")
                .upsert(rebuilt, {
                  onConflict: "order_id,product_id",
                });

              if (rebuildError) {
                console.error(
                  `❌ Failed restoring pending items for ${order.id}`,
                  rebuildError
                );
                continue;
              }

              recovered++;
            }
          }
        } catch (err) {
          console.error("❌ Failed parsing Razorpay notes:", err.message);
        }
      }

      // =======================
      // Update order (fires trigger)
      // =======================
      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "paid",
            payment_status: "success",
            payment_id: payment.id,
            payment_source: "reconciliation",
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
  console.log(`Recovered orders: ${recovered}`);
  console.log(`Unmatched payments: ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log("Unmatched payment IDs:");
    unmatched.forEach((id) => console.log(" -", id));
  }
}

run().catch((err) => {
  console.error("Fatal error:", err);
});
