import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/checkout.css";
import { auth } from "../firebase";
import { Loader2 } from "lucide-react";


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
  }, []);

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
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
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

      // Basic empty check
      if (!name || !phone || !line1 || !city || !state || !pincode) {
        alert("Please fill all address fields");
        setVerifying(false);
        return;
      }

      // Phone validation
      if (!/^\d{10}$/.test(phone)) {
        alert("Enter a valid 10-digit phone number");
        setVerifying(false);
        return;
      }

      // Pincode validation (India)
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
        })
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
        })
      );

      localStorage.setItem("inhandDetails", JSON.stringify({ name, phone }));
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
            required
          />
          <input
            name="phone"
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

          <input
            name="state"
            placeholder="State"
            value={address.state}
            disabled
          />

          <input
            name="pincode"
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
          {verifying && (
    <Loader2 size={18} className="spin pincode-loader" />
  )}
        </div>
      ) : (
        <div className="inhand-box">
          <p>
            <strong>In-Hand Delivery Location</strong>
          </p>
          <p>JSS Science and Technology University (SJCE)</p>
          <p>Mysuru, Karnataka</p>

          <input
            name="name"
            placeholder="Your Name"
            value={inhandDetails.name}
            onChange={handleInhandChange}
            required
          />

          <input
            name="phone"
            placeholder="Phone Number"
            value={inhandDetails.phone}
            onChange={handleInhandChange}
            required
          />

          <p className="note free">No shipping charges</p>
        </div>
      )}

      <button
        className="checkout-continue"
        onClick={handleContinue}
        disabled={verifying}
      >
        {verifying ? "Verifying address..." : "Continue"}
      </button>
    </div>
  );
}

export default CheckoutAddress;
