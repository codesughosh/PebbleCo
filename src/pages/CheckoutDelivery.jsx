import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/checkout.css";

function CheckoutDelivery() {
  const [deliveryType, setDeliveryType] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!deliveryType) return;

    // Temporary storage (we'll replace with context later)
    localStorage.setItem("deliveryType", deliveryType);

    navigate("/checkout/address");
  };

  return (
    <div className="checkout-page">
      <h1>Select Delivery Method</h1>

      <div className="delivery-options">
        {/* SHIPPING */}
        <div
          className={`delivery-card ${
            deliveryType === "shipping" ? "selected" : ""
          }`}
          onClick={() => setDeliveryType("shipping")}
        >
          <h2>🚚 Shipping</h2>
          <p>Delivered anywhere in India</p>
          <p className="note">Shipping charges apply</p>
        </div>

        {/* IN-HAND */}
        <div
          className={`delivery-card ${
            deliveryType === "inhand" ? "selected" : ""
          }`}
          onClick={() => setDeliveryType("inhand")}
        >
          <h2>🎓 In-Hand Delivery</h2>
          <p>Collect at SJCE College, Mysuru</p>
          <p className="note free">Free</p>
        </div>
      </div>

      <button
        className="checkout-continue"
        disabled={!deliveryType}
        onClick={handleContinue}
      >
        Continue
      </button>
    </div>
  );
}

export default CheckoutDelivery;
