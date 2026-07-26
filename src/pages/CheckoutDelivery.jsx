import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, GraduationCap, Truck } from "lucide-react";
import "../styles/checkout.css";

function CheckoutDelivery() {
  const [deliveryType, setDeliveryType] = useState(null);
  const [continueState, setContinueState] = useState("idle");
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!deliveryType || continueState !== "idle") return;

    setContinueState("loading");
    localStorage.setItem("deliveryType", deliveryType);

    window.setTimeout(() => {
      setContinueState("success");
      window.setTimeout(() => navigate("/checkout/address"), 420);
    }, 220);
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
            disabled={continueState !== "idle"}
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
            disabled={continueState !== "idle"}
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
            className={`checkout-continue feedback-action is-${
              continueState === "success" ? "success" : continueState
            }`}
            disabled={!deliveryType || continueState !== "idle"}
            onClick={handleContinue}
            aria-busy={continueState === "loading"}
            aria-live="polite"
          >
            {continueState === "loading" ? (
              <>
                <span className="feedback-spinner" aria-hidden="true" />
                Saving
              </>
            ) : continueState === "success" ? (
              <>
                <Check size={16} strokeWidth={2.2} />
                Saved
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={16} strokeWidth={2} />
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default CheckoutDelivery;
