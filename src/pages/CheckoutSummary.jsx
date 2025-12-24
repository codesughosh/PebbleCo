import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { supabase } from "../supabaseClient";
import "../styles/checkout.css";
const BACKEND_URL = "http://localhost:5000";

function CheckoutSummary() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const deliveryType = localStorage.getItem("deliveryType");
  const address = JSON.parse(localStorage.getItem("shippingAddress"));

  useEffect(() => {
    if (!user || !deliveryType || !address) {
      navigate("/cart");
      return;
    }

    fetchCart();
  }, []);

  const fetchCart = async () => {
    const { data, error } = await supabase
      .from("cart")
      .select(`
        id,
        quantity,
        product:products (
          name,
          price
        )
      `)
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
  

  const saveOrder = async (paymentId) => {
  // 1️⃣ Insert order and get generated ID
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        user_id: user.uid,
        total: total,
        payment_id: paymentId,
        payment_status: "paid",
        status: "paid",
      },
    ])
    .select("id")
    .single();

  if (orderError) {
    console.error("Order insert error:", orderError);
    return;
  }

  // 2️⃣ Insert order items with order_id
  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    quantity: item.quantity,
    price: item.product.price,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error("Order items error:", itemsError);
    return;
  }

  // 3️⃣ Clear cart
  const { error: cartError } = await supabase
    .from("cart")
    .delete()
    .eq("user_id", user.uid);

  if (cartError) {
    console.error("Cart clear error:", cartError);
  }
};

  const handlePayment = async () => {
  try {
    // 1️⃣ Create order from backend
    const res = await fetch("http://localhost:5000/api/create-order", {
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
      key: "rzp_test_RvQ7AGVDDHfcJA", // 🔴 SAME test key as backend
      order_id: orderData.orderId,
      amount: orderData.amount, // paise
      currency: "INR",
      name: "PebbleCo",
      description: "Order Payment",

      handler: async function (response) {
        console.log("🔥 Razorpay handler called");
  console.log("Razorpay response:", response);
  try {
    const verifyRes = await fetch(
      "http://localhost:5000/api/verify-payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(response),
      }
    );
    console.log("🔁 Verify response status:", verifyRes.status);
    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      alert("Payment verification failed");
      return;
    }
      // ✅ Payment verified → now save order
    await saveOrder(response.razorpay_payment_id);

    navigate("/order-success");
  } catch (err) {
    console.error("Verification error:", err);
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
