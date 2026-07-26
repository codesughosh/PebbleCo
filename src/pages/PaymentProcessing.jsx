import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import "../styles/payment-status.css";

function PaymentProcessing() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/order-success/${orderId}`);
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate, orderId]);

  return (
    <div className="payment-status-page">
      <div className="payment-status-card">
        <div className="payment-status-icon success">
          <CheckCircle2 size={30} strokeWidth={1.8} />
        </div>
        <Loader2 className="payment-spinner" size={24} strokeWidth={1.8} />
        <h2>Payment Successful</h2>
        <p>We're confirming your order...</p>
        <p className="muted">Please don't refresh or go back.</p>
      </div>
    </div>
  );
}

export default PaymentProcessing;
