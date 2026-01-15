import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/orderSuccess.css";
import { Loader2 } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    setOrder(data.order);
  } catch (err) {
    console.error("Failed to load order:", err);
  }
};


    fetchOrder();
  }, [orderId]);

  if (!order) {
  return (
    <div className="order-loading-container">
      <Loader2 className="order-loading-icon" />
      <p className="order-loading-text">Loading your order…</p>
    </div>
  );
}


  return (
    <div className="order-success-page">
      <div className="order-success-card">
        <h1 className="order-success-title">Order Confirmed 🎉</h1>
        <p className="order-success-subtitle">
          Thank you for shopping with PebbleCo
        </p>

        <div className="order-success-details">
          <div className="order-success-row">
            <span>Order ID</span>
            <span>{order.id}</span>
          </div>

          <div className="order-success-row">
            <span>Total Paid</span>
            <span>₹{order.total}</span>
          </div>

          <div className="order-success-row">
            <span>Status</span>
            <span>{order.status}</span>
          </div>

          <div className="order-success-row">
            <span>Delivery</span>
            <span>
              {order.delivery_type === "shipping"
                ? "Home Delivery"
                : "In-hand Delivery"}
            </span>
          </div>
        </div>

        <div className="order-success-actions">
          <a
            href={`${BACKEND_URL}/api/invoice/${order.id}`}
            className="order-success-btn primary"
          >
            Download Invoice
          </a>

          <Link to="/orders" className="order-success-btn secondary">
            View Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
