import axios from "axios";
import { getShiprocketToken } from "../shiprocket.js";

export async function createShiprocketOrder({
  orderId,
  customerName,
  customerPhone,
  shippingAddress,
  cartItems
}) {
  // 1️⃣ Get Shiprocket token
  const token = await getShiprocketToken();

  // 2️⃣ Prepare order items (Shiprocket format)
  const orderItems = cartItems.map((item) => ({
    name: item.product_name || item.name || "Product",
    sku: item.product_id,
    units: Number(item.quantity),
    selling_price: Number(item.price_at_purchase || item.price),
  }));

  // 3️⃣ Calculate subtotal (MANDATORY)
  const subTotal = orderItems.reduce(
    (sum, item) => sum + item.selling_price * item.units,
    0
  );

  // 4️⃣ Build Shiprocket payload (STRICT)
  const payload = {
    order_id: orderId,
    order_date: new Date().toISOString().split("T")[0],

    pickup_location: process.env.SHIPROCKET_PICKUP_NAME,

    billing_customer_name: customerName,
    billing_last_name: "",
    billing_address:
      shippingAddress.address ||
      shippingAddress.line1 ||
      shippingAddress.street ||
      "Address not provided",
    billing_address_2: "",
    billing_city: shippingAddress.city,
    billing_pincode: shippingAddress.pincode,
    billing_state: shippingAddress.state,
    billing_country: "India",
    billing_email: shippingAddress.email || "support@pebbleco.store",
    billing_phone: customerPhone,

    shipping_is_billing: true,

    order_items: orderItems,

    payment_method: "Prepaid",

    sub_total: subTotal,

    // 📦 Package details (safe defaults)
    length: 10,
    breadth: 10,
    height: 5,
    weight: 0.5
  };

  try {
    // 5️⃣ Create Shiprocket order
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;

  } catch (err) {
    console.error(
      "🚨 Shiprocket order creation failed:",
      err.response?.data || err.message
    );
    throw err;
  }
}
