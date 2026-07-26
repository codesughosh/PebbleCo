import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, MapPin } from "lucide-react";
import { auth } from "../firebase";
import "../styles/checkout.css";

function CheckoutAddress() {
  const navigate = useNavigate();
  const deliveryType = localStorage.getItem("deliveryType");
  const [verifying, setVerifying] = useState(false);

  const [address, setAddress] = useState({
    name: auth.currentUser?.displayName || "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [inhandDetails, setInhandDetails] = useState({
    name: auth.currentUser?.displayName || "",
    phone: "",
  });

  useEffect(() => {
    if (!deliveryType) {
      navigate("/cart");
    }
  }, [deliveryType, navigate]);

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleInhandChange = (e) => {
    setInhandDetails({
      ...inhandDetails,
      [e.target.name]: e.target.value,
    });
  };

  const fetchCityStateFromPincode = async (pincode) => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();

      if (data[0].Status !== "Success") {
        return null;
      }

      const postOffice = data[0].PostOffice[0];

      return {
        city: postOffice.District,
        state: postOffice.State,
      };
    } catch (err) {
      return null;
    }
  };

  const handleContinue = async () => {
    if (deliveryType === "shipping") {
      const { name, phone, line1, city, state, pincode } = address;

      if (!name || !phone || !line1 || !city || !state || !pincode) {
        alert("Please fill all address fields");
        setVerifying(false);
        return;
      }

      if (!/^\d{10}$/.test(phone)) {
        alert("Enter a valid 10-digit phone number");
        setVerifying(false);
        return;
      }

      if (!/^\d{6}$/.test(pincode)) {
        alert("Enter a valid 6-digit pincode");
        setVerifying(false);
        return;
      }

      if (!city || !state) {
        alert("Please wait for address to auto-fill");
        setVerifying(false);
        return;
      }

      localStorage.setItem(
        "shippingAddress",
        JSON.stringify({
          ...address,
          locationResolved: true,
        }),
      );
    } else {
      const { name, phone } = inhandDetails;

      if (!name || !phone) {
        alert("Please enter name and phone number");
        return;
      }

      if (!/^\d{10}$/.test(phone)) {
        alert("Enter valid 10-digit phone number");
        return;
      }

      localStorage.setItem(
        "shippingAddress",
        JSON.stringify({
          type: "inhand",
          location: "SJCE College, Mysuru",
        }),
      );

      localStorage.setItem("inhandDetails", JSON.stringify({ name, phone }));
    }

    navigate("/checkout/summary");
  };

  return (
    <div className="checkout-page">
      <section className="checkout-shell">
        <div className="checkout-head">
          <span className="checkout-step">Step 2 of 3</span>
          <h1>{deliveryType === "shipping" ? "Delivery Address" : "Pickup Details"}</h1>
          <p>
            {deliveryType === "shipping"
              ? "Enter your address and let the city/state auto-fill from pincode."
              : "Add your contact details for in-hand collection."}
          </p>
        </div>

        {deliveryType === "shipping" ? (
          <div className="checkout-panel address-form">
            <input
              name="name"
              placeholder="Full Name"
              value={address.name}
              onChange={handleChange}
              required
            />
            <input
              name="phone"
              type="tel"
              placeholder="Phone Number"
              value={address.phone}
              onChange={handleChange}
              required
            />
            <input
              name="line1"
              placeholder="Address"
              value={address.line1}
              onChange={handleChange}
              required
            />
            <input name="city" placeholder="City" value={address.city} disabled />
            <input name="state" placeholder="State" value={address.state} disabled />
            <div className="pincode-field">
              <input
                name="pincode"
                inputMode="numeric"
                placeholder="Pincode"
                value={address.pincode}
                onChange={async (e) => {
                  const value = e.target.value;
                  setAddress({
                    ...address,
                    pincode: value,
                    city: "",
                    state: "",
                  });

                  if (value.length === 6 && /^\d+$/.test(value)) {
                    setVerifying(true);

                    const location = await fetchCityStateFromPincode(value);

                    if (location) {
                      setAddress((prev) => ({
                        ...prev,
                        city: location.city,
                        state: location.state,
                      }));
                    } else {
                      alert("Invalid pincode");
                    }

                    setVerifying(false);
                  }
                }}
                required
              />
              {verifying && <Loader2 size={18} className="spin pincode-loader" />}
            </div>
          </div>
        ) : (
          <div className="checkout-panel inhand-box">
            <div className="inhand-location">
              <MapPin size={20} strokeWidth={1.8} />
              <div>
                <strong>In-Hand Delivery Location</strong>
                <p>JSS Science and Technology University (SJCE)</p>
                <p>Mysuru, Karnataka</p>
              </div>
            </div>

            <input
              name="name"
              placeholder="Your Name"
              value={inhandDetails.name}
              onChange={handleInhandChange}
              required
            />

            <input
              name="phone"
              type="tel"
              placeholder="Phone Number"
              value={inhandDetails.phone}
              onChange={handleInhandChange}
              required
            />

            <p className="note free">No shipping charges</p>
          </div>
        )}

        <div className="checkout-actions">
          <button
            type="button"
            className="checkout-continue"
            onClick={handleContinue}
            disabled={verifying}
          >
            {verifying ? (
              <>
                <Loader2 size={16} className="spin" />
                Verifying address
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

export default CheckoutAddress;
