import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { supabase } from "../supabaseClient";
import "../styles/checkout.css";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function CheckoutSummary() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const deliveryType = localStorage.getItem("deliveryType");
  const address = JSON.parse(localStorage.getItem("shippingAddress"));
  const inhandDetails = JSON.parse(localStorage.getItem("inhandDetails"));
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    const deliveryType = localStorage.getItem("deliveryType");

    if (!deliveryType) {
      navigate("/checkout/address");
      return;
    }

    if (deliveryType === "shipping") {
      const address = JSON.parse(localStorage.getItem("shippingAddress"));

      if (!address || address.locationResolved !== true) {
        navigate("/checkout/address");
      }
    }

    if (deliveryType === "inhand") {
      // ✅ In-hand delivery does NOT need address
      return;
    }
  }, []);

  useEffect(() => {
    if (!user || !deliveryType) {
      navigate("/cart");
      return;
    }

    if (deliveryType === "shipping" && !address) {
      navigate("/cart");
      return;
    }

    fetchCart();
  }, []);

  const fetchCart = async () => {
    const { data, error } = await supabase
      .from("cart")
      .select(
        `
        id,
        quantity,
        product:products (
        id,
          name,
          price
        )
      `,
      )
      .eq("user_id", user.uid);

    if (error) {
      console.error(error);
    } else {
      setCartItems(data);
    }

    setLoading(false);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  // TEMP shipping fee logic
  const shippingFee = deliveryType === "shipping" ? 60 : 0;
  const total = subtotal + shippingFee;

  if (!user) {
    alert("Please log in to continue");
    return;
  }

  const handlePayment = async () => {
    if (isPaying) return;

    try {
      setIsPaying(true);

      // 1️⃣ Create order via backend (NOT Supabase)
      const res = await fetch(`${BACKEND_URL}/api/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: total,
          userId: user.uid,
          customerEmail: user.email,
          deliveryType,
          shippingAddress: deliveryType === "shipping" ? address : null,
          inhandDetails: deliveryType === "inhand" ? inhandDetails : null,

          // ✅ SEND CART ITEMS TO BACKEND
          cartItems: cartItems.map((item) => ({
            product_id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Could not create order");
      }

      const { orderId, dbOrderId, amount } = await res.json();

      if (!orderId || !dbOrderId) {
        throw new Error("Invalid order response");
      }

      // 2️⃣ Open Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: orderId,
        amount: amount,
        currency: "INR",
        name: "PebbleCo",

        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${BACKEND_URL}/api/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,

                orderId: dbOrderId,
                userId: user.uid,
                deliveryType,

                customerName:
                  deliveryType === "inhand"
                    ? inhandDetails?.name
                    : address?.name,

                customerPhone:
                  deliveryType === "inhand"
                    ? inhandDetails?.phone
                    : address?.phone,

                cartItems: cartItems.map((item) => ({
                  product_id: item.product.id,
                  name: item.product.name,
                  quantity: item.quantity,
                  price: item.product.price,
                })),
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              throw new Error("Payment verification failed");
            }

            console.log("Navigating to success with order:", dbOrderId);
            navigate(`/payment/success/${dbOrderId}`);
          } catch (err) {
            console.error(err);
            alert("Payment verification failed");
            setIsPaying(false);
          }
        },

        modal: {
          ondismiss: function () {
            setIsPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Payment failed");
      setIsPaying(false);
    }
  };

  if (loading) {
    return <p style={{ padding: "40px" }}>Loading summary...</p>;
  }

  return (
    <div className="checkout-page">
      <h1>Order Summary</h1>

      <div className="summary-box">
        {cartItems.map((item) => (
          <div key={item.id} className="summary-row">
            <span>
              {item.product.name} × {item.quantity}
            </span>
            <span>₹{item.product.price * item.quantity}</span>
          </div>
        ))}

        <div className="summary-row">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>

        <div className="summary-row">
          <span>Shipping</span>
          <span>{shippingFee === 0 ? "Free" : `₹${shippingFee}`}</span>
        </div>

        <div className="summary-total">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
      </div>

      <button
        className="checkout-continue"
        onClick={handlePayment}
        disabled={isPaying}
        style={{
          opacity: isPaying ? 0.6 : 1,
          cursor: isPaying ? "not-allowed" : "pointer",
        }}
      >
        {isPaying ? (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            Processing Payment
          </span>
        ) : (
          <>Pay ₹{total}</>
        )}
      </button>
    </div>
  );
}

export default CheckoutSummary;
