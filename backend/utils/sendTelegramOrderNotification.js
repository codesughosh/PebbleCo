const TELEGRAM_API_BASE = "https://api.telegram.org";

function getTelegramChatIds() {
  return String(
    process.env.TELEGRAM_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || "",
  )
    .split(",")
    .map((chatId) => chatId.trim())
    .filter(Boolean);
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
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

      return `• ${name} x${quantity}`;
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
    "New PebbleCo Order",
    "",
    `Name: ${order.customer_name || "Customer"}`,
    `Phone: ${order.customer_phone || "N/A"}`,
    `Email: ${order.customer_email || "N/A"}`,
    `Total: ${formatMoney(order.total)}`,
    `Delivery: ${formatDelivery(order)}`,
    `Payment: ${paymentLabel || order.payment_status || "Pending"}`,
  ];

  if (order.payment_id) {
    lines.push(`Transaction ID: ${order.payment_id}`);
  }

  lines.push("", "Items:", formatItems(items), "", `Order ID: ${order.id}`);

  return lines.join("\n");
}

export async function sendTelegramOrderNotification({
  order,
  items = [],
  paymentLabel,
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = getTelegramChatIds();

  if (!token || chatIds.length === 0) {
    return { skipped: true };
  }

  const text = buildOrderMessage({ order, items, paymentLabel });
  const results = await Promise.allSettled(
    chatIds.map((chatId) =>
      fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Telegram ${res.status}: ${errorText}`);
        }
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
