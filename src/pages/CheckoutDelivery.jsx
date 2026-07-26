import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, GraduationCap, Truck } from "lucide-react";
import "../styles/checkout.css";

function CheckoutDelivery() {
  const [deliveryType, setDeliveryType] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!deliveryType) return;

    localStorage.setItem("deliveryType", deliveryType);
    navigate("/checkout/address");
  };

  return (
    <div className="checkout-page">
      <section className="checkout-shell">
        <div className="checkout-head">
          <span className="checkout-step">Step 1 of 3</span>
          <h1>Delivery Type</h1>
          <p>Choose the delivery option that works best for you.</p>
        </div>

        <div className="delivery-options">
          <button
            type="button"
            className={`delivery-card ${deliveryType === "shipping" ? "selected" : ""}`}
            onClick={() => setDeliveryType("shipping")}
          >
            <span className="delivery-icon">
              <Truck size={22} strokeWidth={2} />
            </span>
            <h2 className="delivery-title">Shipping</h2>
            <p>Delivered anywhere in India</p>
            <p className="note">Shipping charges apply</p>
          </button>

          <button
            type="button"
            className={`delivery-card ${deliveryType === "inhand" ? "selected" : ""}`}
            onClick={() => setDeliveryType("inhand")}
          >
            <span className="delivery-icon">
              <GraduationCap size={22} strokeWidth={2} />
            </span>
            <h2 className="delivery-title">In-Hand</h2>
            <p>Collect at JSSSTU, Mysuru</p>
            <p className="note free">Free</p>
          </button>
        </div>

        <div className="checkout-actions">
          <button
            type="button"
            className="checkout-continue"
            disabled={!deliveryType}
            onClick={handleContinue}
          >
            Continue
            <ArrowRight size={16} strokeWidth={2} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default CheckoutDelivery;
