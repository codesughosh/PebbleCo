import { CheckCircle, ChevronRight, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/cart-toast.css";

function CartToast({ show, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="cart-toast" role="status" aria-live="polite">
      <div className="toast-left">
        <span className="toast-icon-wrap">
          <CheckCircle size={20} className="toast-icon" />
        </span>
        <span className="toast-copy">
          <strong>Added to cart</strong>
          <small>Ready for checkout</small>
        </span>
      </div>

      <button
        className="toast-btn"
        onClick={() => navigate("/cart")}
      >
        <ShoppingBag size={16} strokeWidth={2} />
        View Cart
        <ChevronRight size={16} strokeWidth={2.2} />
      </button>

      <div className="toast-progress" />
    </div>
  );
}

export default CartToast;
