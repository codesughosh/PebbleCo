import axios from "axios";
import { getShiprocketToken } from "../shiprocket.js";

export async function createShiprocketOrder({ order, orderItems }) {
  const token = await getShiprocketToken();

  const payload = {
    order_id: order.id,
    order_date: new Date().toISOString().split("T")[0],
    pickup_location: "Primary",

    billing_customer_name: order.shipping_address.name,
    billing_last_name: "",
    billing_address: order.shipping_address.address,
    billing_city: order.shipping_address.city,
    billing_pincode: order.shipping_address.pincode,
    billing_state: order.shipping_address.state,
    billing_country: "India",
    billing_email: order.shipping_address.email,
    billing_phone: order.shipping_address.phone,

    shipping_is_billing: true,

    order_items: orderItems.map((item) => ({
      name: item.product_name,   // ✅ FIX
      sku: item.product_id,
      units: item.quantity,
      selling_price: item.price_at_purchase,
    })),

    payment_method: "Prepaid",
    sub_total: order.total,

    length: 10,
    breadth: 10,
    height: 5,
    weight: 0.5,
  };

  const response = await axios.post(
    "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}
