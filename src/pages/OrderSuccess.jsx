import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  Download,
  Loader2,
  ReceiptText,
  XCircle,
} from "lucide-react";
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

  const pendingVerification = order.payment_status === "pending_verification";
  const rejected = order.payment_status === "rejected";
  const paymentKicker = rejected
    ? "Payment Rejected"
    : pendingVerification
      ? "Pending Verification"
      : "Confirmed";
  const paymentTitle = rejected
    ? "Payment Rejected"
    : pendingVerification
      ? "Payment Submitted"
      : "Order Confirmed";
  const paymentSubtitle = rejected
    ? "Please contact PebbleCo if you think this needs another look."
    : pendingVerification
      ? "We will verify your UPI payment and confirm your order soon."
      : "Thank you for shopping with PebbleCo.";
  const formatPaymentStatus = (status) => {
    if (status === "success") return "Paid";
    if (status === "pending_verification") return "Pending verification";
    if (status === "rejected") return "Rejected";
    if (status === "pending") return "Payment pending";
    return status || "--";
  };

  return (
    <div className="order-success-page">
      <div className="order-success-card">
        <div
          className={`order-success-badge ${
            pendingVerification ? "pending" : ""
          } ${rejected ? "rejected" : ""}`}
        >
          {rejected ? (
            <XCircle size={28} strokeWidth={1.8} />
          ) : pendingVerification ? (
            <Clock3 size={28} strokeWidth={1.8} />
          ) : (
            <CheckCircle2 size={28} strokeWidth={1.8} />
          )}
        </div>

        <span className="order-success-kicker">{paymentKicker}</span>
        <h1 className="order-success-title">{paymentTitle}</h1>
        <p className="order-success-subtitle">{paymentSubtitle}</p>

        <div className="order-success-details">
          <div className="order-success-row">
            <span>Order ID</span>
            <span>{order.id}</span>
          </div>

          <div className="order-success-row">
            <span>{pendingVerification ? "Amount" : "Total Paid"}</span>
            <span>{"\u20B9"}{order.total}</span>
          </div>

          {order.payment_id && (
            <div className="order-success-row">
              <span>
                {pendingVerification ? "UPI Transaction ID" : "Payment Reference"}
              </span>
              <span>{order.payment_id}</span>
            </div>
          )}

          <div className="order-success-row">
            <span>Payment</span>
            <span>{formatPaymentStatus(order.payment_status)}</span>
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
          {!pendingVerification && !rejected && (
            <a
              href={`${BACKEND_URL}/api/invoice/${order.id}`}
              className="order-success-btn primary"
            >
              <Download size={16} strokeWidth={2} />
              Download Invoice
            </a>
          )}

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
