import { CheckCircle } from "lucide-react";
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
    <div className="cart-toast">
      <div className="toast-left">
        <CheckCircle size={22} className="toast-icon" />
        <span>Added to cart</span>
      </div>

      <button
        className="toast-btn"
        onClick={() => navigate("/cart")}
      >
        View Cart
      </button>

      <div className="toast-progress" />
    </div>
  );
}

export default CartToast;
