const TELEGRAM_API_BASE = "https://api.telegram.org";
const ADMIN_ORDERS_URL =
  process.env.ADMIN_ORDERS_URL || "https://pebbleco.shop/admin/orders";

function getTelegramChatIds() {
  return String(
    process.env.TELEGRAM_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || "",
  )
    .split(",")
    .map((chatId) => chatId.trim())
    .filter(Boolean);
}

function formatMoney(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function escapeHtml(value) {
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

      return `- ${escapeHtml(name)} x${quantity}`;
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
    "<b>PebbleCo</b>",
    "<b>New handmade order</b>",
    "",
    `<b>Name:</b> ${escapeHtml(order.customer_name || "Customer")}`,
    `<b>Phone:</b> ${escapeHtml(order.customer_phone || "N/A")}`,
    `<b>Email:</b> ${escapeHtml(order.customer_email || "N/A")}`,
    `<b>Total:</b> ${formatMoney(order.total)}`,
    `<b>Delivery:</b> ${escapeHtml(formatDelivery(order))}`,
    `<b>Payment:</b> ${escapeHtml(
      paymentLabel || order.payment_status || "Pending",
    )}`,
  ];

  if (order.payment_id) {
    lines.push(
      `<b>Transaction ID:</b> <code>${escapeHtml(order.payment_id)}</code>`,
    );
  }

  lines.push(
    "",
    "<b>Items</b>",
    formatItems(items),
    "",
    `<b>Order ID:</b> <code>${escapeHtml(order.id)}</code>`,
  );

  return lines.join("\n");
}

function buildReplyMarkup({ order, includeVerifyButton }) {
  const rows = [];

  if (includeVerifyButton) {
    rows.push([
      {
        text: "Verify UPI payment",
        callback_data: `verify_order:${order.id}`,
      },
    ]);
  }

  rows.push([{ text: "Open admin orders", url: ADMIN_ORDERS_URL }]);

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
    "<b>Payment verified</b>",
    "",
    `<b>Name:</b> ${escapeHtml(order.customer_name || "Customer")}`,
    `<b>Total:</b> ${formatMoney(order.total)}`,
    `<b>Order ID:</b> <code>${escapeHtml(order.id)}</code>`,
    "",
    "Confirmation email sent with Brevo.",
  ].join("\n");
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
      sendTelegramRequest("sendMessage", {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: buildReplyMarkup({ order, includeVerifyButton }),
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
    reply_markup: {
      inline_keyboard: [[{ text: "Open admin orders", url: ADMIN_ORDERS_URL }]],
    },
  });
}

export async function sendTelegramAdminMessage(text) {
  const chatIds = getTelegramChatIds();

  if (!process.env.TELEGRAM_BOT_TOKEN || chatIds.length === 0) {
    return { skipped: true };
  }

  const results = await Promise.allSettled(
    chatIds.map((chatId) =>
      sendTelegramRequest("sendMessage", {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    ),
  );

  const failed = results.filter((result) => result.status === "rejected");

  return {
    sent: results.length - failed.length,
    failed: failed.length,
  };
}
