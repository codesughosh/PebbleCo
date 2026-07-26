import { useNavigate } from "react-router-dom";
import { RotateCcw, ShoppingBag, XCircle } from "lucide-react";
import "../styles/payment-status.css";

function PaymentFailed() {
  const navigate = useNavigate();

  return (
    <div className="payment-status-page">
      <div className="payment-status-card">
        <div className="payment-status-icon failed">
          <XCircle size={32} strokeWidth={1.8} />
        </div>
        <h2>Payment Failed</h2>
        <p>No worries, no money was deducted.</p>

        <div className="payment-actions">
          <button type="button" onClick={() => navigate("/checkout/summary")}>
            <RotateCcw size={16} strokeWidth={2} />
            Try Again
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => navigate("/cart")}
          >
            <ShoppingBag size={16} strokeWidth={2} />
            Go to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailed;
