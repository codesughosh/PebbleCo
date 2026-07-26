import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  CheckCircle2,
  Clock3,
  Download,
  ReceiptText,
  XCircle,
} from "lucide-react";
import { PageLoader } from "../components/Skeleton";
import { auth } from "../firebase";
import "../styles/orderSuccess.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function OrderSuccess() {
  const { orderId } = useParams();
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [invoiceState, setInvoiceState] = useState("idle");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;

    const fetchOrder = async () => {
      if (!user) {
        setError("Please login to view this order.");
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Could not load order");
        }

        setOrder(data.order);
      } catch (err) {
        console.error("Failed to load order:", err);
        setError("Could not load this order.");
      }
    };

    fetchOrder();
  }, [authReady, orderId, user]);

  const downloadInvoice = async () => {
    if (!user || !order || invoiceState !== "idle") return;

    try {
      setInvoiceState("loading");
      const token = await user.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/invoice/${order.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Could not download invoice");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `PebbleCo-Invoice-${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setInvoiceState("success");
      window.setTimeout(() => setInvoiceState("idle"), 1200);
    } catch (err) {
      console.error("Invoice download failed:", err);
      alert("Could not download invoice. Please try again.");
      setInvoiceState("idle");
    }
  };

  if (!authReady || (!order && !error)) {
    return <PageLoader label="Loading your order..." />;
  }

  if (error) {
    return (
      <div className="order-success-page">
        <div className="order-success-card">
          <div className="order-success-badge rejected">
            <XCircle size={28} strokeWidth={1.8} />
          </div>
          <span className="order-success-kicker">Order Unavailable</span>
          <h1 className="order-success-title">Could not open this order</h1>
          <p className="order-success-subtitle">{error}</p>
          <div className="order-success-actions">
            <Link to="/login" className="order-success-btn primary">
              Login
            </Link>
            <Link to="/orders" className="order-success-btn secondary">
              <ReceiptText size={16} strokeWidth={2} />
              View Orders
            </Link>
          </div>
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
            <button
              type="button"
              className="order-success-btn primary"
              onClick={downloadInvoice}
              disabled={invoiceState === "loading"}
            >
              <Download size={16} strokeWidth={2} />
              {invoiceState === "loading" ? "Downloading" : "Download Invoice"}
            </button>
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
