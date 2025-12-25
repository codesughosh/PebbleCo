import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/checkout.css";

function CheckoutAddress() {
  const navigate = useNavigate();
  const deliveryType = localStorage.getItem("deliveryType");

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (!deliveryType) {
      navigate("/cart");
    }
  }, []);

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleContinue = () => {
    if (deliveryType === "shipping") {
      const { name, phone, line1, city, state, pincode } = address;

      if (!name || !phone || !line1 || !city || !state || !pincode) {
        alert("Please fill all address fields");
        return;
      }

      localStorage.setItem("shippingAddress", JSON.stringify(address));
    } else {
      localStorage.setItem(
        "shippingAddress",
        JSON.stringify({
          type: "inhand",
          location: "SJCE College, Mysuru",
        })
      );
    }

    navigate("/checkout/summary");
  };

  return (
    <div className="checkout-page">
      <h1>Delivery Address</h1>

      {deliveryType === "shipping" ? (
        <div className="address-form">
          <input
            name="name"
            placeholder="Full Name"
            value={address.name}
            onChange={handleChange}
          />
          <input
            name="phone"
            placeholder="Phone Number"
            value={address.phone}
            onChange={handleChange}
          />
          <input
            name="line1"
            placeholder="Address"
            value={address.line1}
            onChange={handleChange}
          />
          <input
            name="city"
            placeholder="City"
            value={address.city}
            onChange={handleChange}
          />
          <input
            name="state"
            placeholder="State"
            value={address.state}
            onChange={handleChange}
          />
          <input
            name="pincode"
            placeholder="Pincode"
            value={address.pincode}
            onChange={handleChange}
          />
        </div>
      ) : (
        <div className="inhand-box">
          <p>
            <strong>In-Hand Delivery Location</strong>
          </p>
          <p>JSS Science and Technology University (SJCE)</p>
          <p>Mysuru, Karnataka</p>
          <p className="note free">No shipping charges</p>
        </div>
      )}

      <button className="checkout-continue" onClick={handleContinue}>
        Continue
      </button>
    </div>
  );
}

export default CheckoutAddress;
