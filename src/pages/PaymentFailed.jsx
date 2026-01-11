import { useNavigate } from "react-router-dom";
import "../styles/payment-status.css";

function PaymentFailed() {
  const navigate = useNavigate();

  return (
    <main className="page-container">
    <div className="payment-status-page">
      <div className="payment-status-card">
        <div className="fail-icon">✕</div>
        <h2>Payment Failed</h2>
        <p>No worries — no money was deducted.</p>

        <div className="payment-actions">
          <button onClick={() => navigate("/checkout/summary")}>
            Try Again
          </button>
          <button
            className="secondary"
            onClick={() => navigate("/cart")}
          >
            Go to Cart
          </button>
        </div>
      </div>
    </div>
    </main>
  );
}

export default PaymentFailed;
