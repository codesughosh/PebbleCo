import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/checkout.css";
import { Truck, GraduationCap } from "lucide-react";

function CheckoutDelivery() {
  const [deliveryType, setDeliveryType] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!deliveryType) return;

    // store only delivery type
    localStorage.setItem("deliveryType", deliveryType);

    navigate("/checkout/address");
  };

  return (
    <div className="checkout-page">
      <h1>Delivery Type:</h1>

      <div className="delivery-options">
        {/* SHIPPING */}
        <div
          className={`delivery-card ${
            deliveryType === "shipping" ? "selected" : ""
          }`}
          onClick={() => setDeliveryType("shipping")}
        >
          <h2 className="delivery-title">
            <Truck size={22} strokeWidth={2} />
            <span>  Shipping</span>
          </h2>

          <p>Delivered anywhere in India</p>
          <p className="note">*Shipping charges apply</p>
        </div>

        {/* IN-HAND */}
        <div
          className={`delivery-card ${
            deliveryType === "inhand" ? "selected" : ""
          }`}
          onClick={() => setDeliveryType("inhand")}
        >
          <h2 className="delivery-title">
            <GraduationCap size={22} strokeWidth={2} />
            <span>  In-Hand</span>
          </h2>

          <p>Collect at JSSSTU, Mysuru</p>
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
