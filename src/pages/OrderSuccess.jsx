import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Download, Loader2, ReceiptText } from "lucide-react";
import "../styles/orderSuccess.css";

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
      <div className="order-loading-top">
        <div className="order-loading-card">
          <Loader2 className="order-loading-icon" />
          <p className="order-loading-text">Loading your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-success-page">
      <div className="order-success-card">
        <div className="order-success-badge">
          <CheckCircle2 size={28} strokeWidth={1.8} />
        </div>

        <span className="order-success-kicker">Confirmed</span>
        <h1 className="order-success-title">Order Confirmed</h1>
        <p className="order-success-subtitle">
          Thank you for shopping with PebbleCo.
        </p>

        <div className="order-success-details">
          <div className="order-success-row">
            <span>Order ID</span>
            <span>{order.id}</span>
          </div>

          <div className="order-success-row">
            <span>Total Paid</span>
            <span>{"\u20B9"}{order.total}</span>
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
            <Download size={16} strokeWidth={2} />
            Download Invoice
          </a>

          <Link to="/orders" className="order-success-btn secondary">
            <ReceiptText size={16} strokeWidth={2} />
            View Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
