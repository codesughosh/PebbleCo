/* global process */
import express from "express";
import { supabase } from "../supabase.js";
import { sendOrderEmail } from "../utils/sendOrderEmail.js";
import { fetchAdminFinanceReport } from "./adminFinance.js";
import {
  answerTelegramCallback,
  buildAdminLinksKeyboard,
  buildVerifiedOrderMessage,
  escapeTelegramHtml,
  formatTelegramMoney,
  isAuthorizedTelegramChat,
  removeTelegramInlineKeyboard,
  sendTelegramAdminMessage,
  sendTelegramMessage,
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

function normalizeCommand(text) {
  const command = String(text || "")
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase();

  return command?.split("@")[0] || "";
}

function formatStatsDate() {
  return new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

function formatTopRows(rows, labelKey) {
  if (!rows.length) return "Nothing recorded yet.";

  return rows
    .slice(0, 4)
    .map(
      (row, index) =>
        `${index + 1}. ${escapeTelegramHtml(row[labelKey] || "Other")} - <b>${formatTelegramMoney(
          row.amount,
        )}</b>`,
    )
    .join("\n");
}

function buildWelcomeMessage({ chatId, authorized }) {
  if (!authorized) {
    return [
      "<b>PebbleCo order desk</b>",
      "",
      "Hi. This bot is private for PebbleCo admin updates.",
      "Ask the admin to add this chat ID to <code>TELEGRAM_CHAT_IDS</code>:",
      `<code>${escapeTelegramHtml(chatId)}</code>`,
    ].join("\n");
  }

  return [
    "<b>PebbleCo order desk</b>",
    "",
    "Hi, welcome in. I can keep the tiny business desk moving while orders come in.",
    "",
    "<b>What I can do</b>",
    "<code>/stats</code> - today's ERP money snapshot",
    "<code>/help</code> - quick admin links",
    "",
    "New UPI orders will arrive here with a verify button, and verified payments can trigger the Brevo confirmation email.",
  ].join("\n");
}

function buildStatsMessage(report) {
  const totals = report.totals || {};
  const tableNotes = [];

  if (!report.expenseTableReady) {
    tableNotes.push("Expense table is not ready yet.");
  }

  if (!report.incomeTableReady) {
    tableNotes.push("Manual income table is not ready yet.");
  }

  return [
    "<b>PebbleCo ERP snapshot</b>",
    `<i>${escapeTelegramHtml(formatStatsDate())}</i>`,
    "",
    `<b>Bookings:</b> ${formatTelegramMoney(totals.allBookings)}`,
    `<b>Received income:</b> ${formatTelegramMoney(totals.paidIncome)}`,
    `<b>Expenses:</b> ${formatTelegramMoney(totals.expenses)}`,
    `<b>Net profit:</b> ${formatTelegramMoney(totals.netProfit)}`,
    "",
    `<b>Orders:</b> ${Number(totals.orderCount || 0)} active, ${Number(
      totals.paidOrderCount || 0,
    )} paid`,
    `<b>Pending checks:</b> ${Number(totals.pendingOrderCount || 0)} orders worth ${formatTelegramMoney(
      totals.pendingBookings,
    )}`,
    `<b>Razorpay fees:</b> ${formatTelegramMoney(totals.razorpayFees)}`,
    "",
    "<b>Top expense types</b>",
    formatTopRows(report.expenseCategories || [], "category"),
    "",
    "<b>Income sources</b>",
    formatTopRows(report.incomeSources || [], "source"),
    ...(tableNotes.length ? ["", `<i>${escapeTelegramHtml(tableNotes.join(" "))}</i>`] : []),
  ].join("\n");
}

async function handleTelegramMessage(message) {
  const chatId = message?.chat?.id;
  if (!chatId) return;

  const command = normalizeCommand(message.text);
  const authorized = isAuthorizedTelegramChat(chatId);

  if (command === "/stats") {
    if (!authorized) {
      await sendTelegramMessage({
        chatId,
        text: buildWelcomeMessage({ chatId, authorized }),
      });
      return;
    }

    try {
      const report = await fetchAdminFinanceReport();
      await sendTelegramMessage({
        chatId,
        text: buildStatsMessage(report),
        replyMarkup: buildAdminLinksKeyboard(),
      });
    } catch (err) {
      console.error("Telegram stats failed:", err);
      await sendTelegramMessage({
        chatId,
        text: [
          "<b>PebbleCo ERP snapshot</b>",
          "",
          "I could not fetch the money desk right now. Open the ERP and try again in a bit.",
        ].join("\n"),
        replyMarkup: buildAdminLinksKeyboard(),
      });
    }

    return;
  }

  if (command === "/start" || command === "/help") {
    await sendTelegramMessage({
      chatId,
      text: buildWelcomeMessage({ chatId, authorized }),
      replyMarkup: authorized ? buildAdminLinksKeyboard() : undefined,
    });
    return;
  }

  if (!command || !command.startsWith("/")) return;

  await sendTelegramMessage({
    chatId,
    text: authorized
      ? "I know <code>/stats</code> and <code>/help</code>. Small desk, useful buttons."
      : buildWelcomeMessage({ chatId, authorized }),
    replyMarkup: authorized ? buildAdminLinksKeyboard() : undefined,
  });
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
    const message = req.body?.message;
    if (message) {
      try {
        await handleTelegramMessage(message);
      } catch (err) {
        console.error("Telegram message handling failed:", err);
      }
    }

    return res.json({ ok: true });
  }

  if (!isAuthorizedTelegramChat(callback.message?.chat?.id)) {
    await answerTelegramCallback(callback.id, "This PebbleCo action is private.");
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
