/* global process */
const TELEGRAM_API_BASE = "https://api.telegram.org";
const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || "https://pebbleco.shop/admin";
const ADMIN_ORDERS_URL =
  process.env.ADMIN_ORDERS_URL || `${ADMIN_BASE_URL}/orders`;
const ADMIN_INCOME_URL =
  process.env.ADMIN_INCOME_URL || `${ADMIN_BASE_URL}?tab=income`;
const ADMIN_EXPENSES_URL =
  process.env.ADMIN_EXPENSES_URL || `${ADMIN_BASE_URL}?tab=expenses`;

export function getTelegramChatIds() {
  return String(
    process.env.TELEGRAM_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || "",
  )
    .split(",")
    .map((chatId) => chatId.trim())
    .filter(Boolean);
}

export function isAuthorizedTelegramChat(chatId) {
  return getTelegramChatIds().includes(String(chatId || ""));
}

export function formatTelegramMoney(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export function escapeTelegramHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatItems(items = []) {
  if (!items.length) return "Items not loaded";

  return items
    .map((item) => {
      const name =
        item.product_name ||
        item.products?.name ||
        item.product?.name ||
        "Product";
      const quantity = Number(item.quantity || 0) || 1;

      return `- ${escapeTelegramHtml(name)} x${quantity}`;
    })
    .join("\n");
}

function formatDelivery(order) {
  if (order.delivery_type === "shipping") return "Shipping";
  if (order.delivery_type === "inhand") return "In-hand";
  return order.delivery_type || "Not set";
}

function buildOrderMessage({ order, items, paymentLabel }) {
  const lines = [
    "🌸 <b>PebbleCo order desk</b>",
    "🛍️ <b>New handmade order just came in!</b>",
    "A tiny parcel is waiting for your magic check.",
    "",
    `👤 <b>Name:</b> ${escapeTelegramHtml(order.customer_name || "Customer")}`,
    `📞 <b>Phone:</b> ${escapeTelegramHtml(order.customer_phone || "N/A")}`,
    `💌 <b>Email:</b> ${escapeTelegramHtml(order.customer_email || "N/A")}`,
    `💸 <b>Total:</b> ${formatTelegramMoney(order.total)}`,
    `📦 <b>Delivery:</b> ${escapeTelegramHtml(formatDelivery(order))}`,
    `🧾 <b>Payment:</b> ${escapeTelegramHtml(
      paymentLabel || order.payment_status || "Pending",
    )}`,
  ];

  if (order.payment_id) {
    lines.push(
      `🔎 <b>Transaction ID:</b> <code>${escapeTelegramHtml(order.payment_id)}</code>`,
    );
  }

  lines.push(
    "",
    "🎀 <b>Items</b>",
    formatItems(items),
    "",
    `🪄 <b>Order ID:</b> <code>${escapeTelegramHtml(order.id)}</code>`,
  );

  return lines.join("\n");
}

export function buildAdminLinksKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📊 Open ERP", url: ADMIN_BASE_URL },
        { text: "🧾 Orders", url: ADMIN_ORDERS_URL },
      ],
      [
        { text: "💚 Income", url: ADMIN_INCOME_URL },
        { text: "💗 Expenses", url: ADMIN_EXPENSES_URL },
      ],
    ],
  };
}

function buildReplyMarkup({ order, includeVerifyButton }) {
  const rows = [];

  if (includeVerifyButton) {
    rows.push([
      {
        text: "✅ Verify UPI payment",
        callback_data: `verify_order:${order.id}`,
      },
    ]);
  }

  rows.push(...buildAdminLinksKeyboard().inline_keyboard);

  return { inline_keyboard: rows };
}

async function sendTelegramRequest(method, payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return { skipped: true };
  }

  const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Telegram ${res.status}: ${errorText}`);
  }

  return res.json();
}

export function buildVerifiedOrderMessage(order) {
  return [
    "<b>PebbleCo</b>",
    "✅ <b>Payment verified</b>",
    "The customer confirmation email has been sent. Tiny order desk is happy.",
    "",
    `👤 <b>Name:</b> ${escapeTelegramHtml(order.customer_name || "Customer")}`,
    `💸 <b>Total:</b> ${formatTelegramMoney(order.total)}`,
    `🪄 <b>Order ID:</b> <code>${escapeTelegramHtml(order.id)}</code>`,
  ].join("\n");
}

export async function sendTelegramMessage({ chatId, text, replyMarkup }) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !chatId) {
    return { skipped: true };
  }

  return sendTelegramRequest("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function sendTelegramOrderNotification({
  order,
  items = [],
  paymentLabel,
  includeVerifyButton = false,
}) {
  const chatIds = getTelegramChatIds();

  if (!process.env.TELEGRAM_BOT_TOKEN || chatIds.length === 0) {
    return { skipped: true };
  }

  const text = buildOrderMessage({ order, items, paymentLabel });
  const results = await Promise.allSettled(
    chatIds.map((chatId) =>
      sendTelegramMessage({
        chatId,
        text,
        replyMarkup: buildReplyMarkup({ order, includeVerifyButton }),
      }),
    ),
  );

  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length > 0) {
    console.error("Telegram order notification failed:", failed);
  }

  return {
    sent: results.length - failed.length,
    failed: failed.length,
  };
}

export async function answerTelegramCallback(callbackQueryId, text) {
  if (!callbackQueryId) return { skipped: true };

  return sendTelegramRequest("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}

export async function removeTelegramInlineKeyboard({ chatId, messageId }) {
  if (!chatId || !messageId) return { skipped: true };

  return sendTelegramRequest("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: buildAdminLinksKeyboard(),
  });
}

export async function sendTelegramAdminMessage(text, replyMarkup) {
  const chatIds = getTelegramChatIds();

  if (!process.env.TELEGRAM_BOT_TOKEN || chatIds.length === 0) {
    return { skipped: true };
  }

  const results = await Promise.allSettled(
    chatIds.map((chatId) =>
      sendTelegramMessage({
        chatId,
        text,
        replyMarkup,
      }),
    ),
  );

  const failed = results.filter((result) => result.status === "rejected");

  return {
    sent: results.length - failed.length,
    failed: failed.length,
  };
}
