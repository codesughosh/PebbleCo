import express from "express";
import { supabase } from "../supabase.js";
import { sendOrderEmail } from "../utils/sendOrderEmail.js";
import {
  answerTelegramCallback,
  buildVerifiedOrderMessage,
  removeTelegramInlineKeyboard,
  sendTelegramAdminMessage,
} from "../utils/sendTelegramOrderNotification.js";

const router = express.Router();
const VERIFY_PREFIX = "verify_order:";

function hasValidTelegramSecret(req) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = req.get("x-telegram-bot-api-secret-token");

  return Boolean(expectedSecret && receivedSecret === expectedSecret);
}

function getCallbackOrderId(data) {
  const value = String(data || "");

  if (!value.startsWith(VERIFY_PREFIX)) return null;

  const orderId = value.slice(VERIFY_PREFIX.length);
  return /^[0-9a-f-]{36}$/i.test(orderId) ? orderId : null;
}

async function verifyManualPayment(orderId) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, customer_email, customer_name, total, payment_status, delivery_type",
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { ok: false, message: "Order not found." };
  }

  if (order.payment_status === "success") {
    return {
      ok: true,
      alreadyVerified: true,
      order,
      message: "Already verified.",
    };
  }

  if (order.payment_status !== "pending_verification") {
    return {
      ok: false,
      order,
      message: `Cannot verify. Current status: ${order.payment_status || "unknown"}.`,
    };
  }

  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_status: "success",
    })
    .eq("id", orderId)
    .eq("payment_status", "pending_verification")
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (!updatedOrder) {
    return { ok: false, order, message: "Order status changed. Refresh admin." };
  }

  if (!order.customer_email) {
    return {
      ok: true,
      order: { ...order, payment_status: "success" },
      message: "Verified, but customer email is missing.",
    };
  }

  try {
    await sendOrderEmail({
      to: order.customer_email,
      customerName: order.customer_name || "Customer",
      orderId: order.id,
      total: order.total,
      deliveryType: order.delivery_type,
      type: "confirmed",
    });
  } catch (emailError) {
    console.error("Telegram verification email failed:", emailError);

    return {
      ok: true,
      emailFailed: true,
      order: { ...order, payment_status: "success" },
      message: "Payment verified, but confirmation email failed.",
    };
  }

  return {
    ok: true,
    emailSent: true,
    order: { ...order, payment_status: "success" },
    message: "Payment verified. Confirmation email sent.",
  };
}

router.post("/telegram-webhook", async (req, res) => {
  if (!hasValidTelegramSecret(req)) {
    return res.status(401).json({ error: "Unauthorized Telegram webhook" });
  }

  const callback = req.body?.callback_query;
  if (!callback) {
    return res.json({ ok: true });
  }

  const orderId = getCallbackOrderId(callback.data);
  if (!orderId) {
    await answerTelegramCallback(callback.id, "Unknown PebbleCo action.");
    return res.json({ ok: true });
  }

  try {
    const result = await verifyManualPayment(orderId);
    await answerTelegramCallback(callback.id, result.message);

    if (result.ok) {
      try {
        await removeTelegramInlineKeyboard({
          chatId: callback.message?.chat?.id,
          messageId: callback.message?.message_id,
        });
      } catch (editError) {
        console.error("Telegram button cleanup failed:", editError);
      }

      if (
        !result.alreadyVerified &&
        result.emailSent &&
        result.order?.customer_email
      ) {
        try {
          await sendTelegramAdminMessage(buildVerifiedOrderMessage(result.order));
        } catch (notifyError) {
          console.error("Telegram verified message failed:", notifyError);
        }
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Telegram verify payment failed:", err);
    await answerTelegramCallback(
      callback.id,
      "Could not verify payment. Open admin dashboard.",
    );
    res.json({ ok: true });
  }
});

export default router;
