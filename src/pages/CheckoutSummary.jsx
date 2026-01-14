import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { supabase } from "../supabaseClient";
import "../styles/checkout.css";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function CheckoutSummary() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [createdOrder, setCreatedOrder] = useState(null);

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const deliveryType = localStorage.getItem("deliveryType");
  const address = JSON.parse(localStorage.getItem("shippingAddress"));
  const inhandDetails = JSON.parse(localStorage.getItem("inhandDetails"));

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
      `
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
    0
  );

  // TEMP shipping fee logic
  const shippingFee = deliveryType === "shipping" ? 60 : 0;
  const total = subtotal + shippingFee;

  const handlePayment = async () => {
    try {
      // 🔹 STEP A: create order in Supabase first
      const shippingAddress =
        deliveryType === "shipping"
          ? JSON.parse(localStorage.getItem("shippingAddress"))
          : null;

      const { data: order, error } = await supabase
        .from("orders")
        .insert([
          {
            user_id: user.uid,
            total: total,
            customer_email: user.email,
            delivery_type: deliveryType,
            shipping_address: shippingAddress, // ✅ THIS WAS MISSING
            payment_status: "pending",
            status: "pending",
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Order creation failed:", error);
        alert("Could not create order");
        return;
      }

      setCreatedOrder(order);

      // 1️⃣ Create order from backend
      const res = await fetch(`${BACKEND_URL}/api/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: total }),
      });

      const orderData = await res.json();

      console.log("Order from backend:", orderData);

      if (!orderData.orderId) {
        alert("Order creation failed");
        return;
      }

      // 2️⃣ Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // 🔴 SAME test key as backend
        order_id: orderData.orderId,
        amount: orderData.amount, // paise
        currency: "INR",
        name: "PebbleCo",
        description: "Order Payment",

        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${BACKEND_URL}/api/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,

                orderId: order.id,
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

                cartItems: cartItems.map((i) => ({
                  product_id: i.product.id,
                  name: i.product.name, // ✅ ADD THIS LINE
                  quantity: i.quantity,
                  price: i.product.price,
                })),
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              alert("Payment verification failed");
              return;
            }

            navigate(`/payment/success/${order.id}`);
          } catch (err) {
            console.error(err);
            alert("Payment verification error");
          }
        },

        modal: {
          ondismiss: function () {
            console.log("Checkout closed");
          },
        },

        theme: {
          color: "#fdd2dc",
        },
      };

      // 3️⃣ Open Razorpay
      const rzp = new window.Razorpay(options);

      // 🔴 Handle payment failure
      rzp.on("payment.failed", function () {
        navigate("/payment/failed");
      });

      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed");
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

      <button className="checkout-continue" onClick={handlePayment}>
        Pay ₹{total}
      </button>
    </div>
  );
}

export default CheckoutSummary;
