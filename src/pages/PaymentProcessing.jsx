import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/payment-status.css";

function PaymentProcessing() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/order-success/${orderId}`);
    }, 2500);

    return () => clearTimeout(timer);
  }, [orderId]);

  return (
    <main className="page-container">
    <div className="payment-status-page">
      <div className="payment-status-card">
        <div className="spinner" />
        <h2>Payment Successful 💖</h2>
        <p>We’re confirming your order…</p>
        <p className="muted">
          Please don’t refresh or go back
        </p>
      </div>
    </div>
    </main>
  );
}

export default PaymentProcessing;
