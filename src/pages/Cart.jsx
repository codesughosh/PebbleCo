import { useEffect, useState } from "react";
import "../styles/cart.css";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 🔹 Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Fetch cart when user is available
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      const token = await user.getIdToken();

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setCartItems(data);
    } catch (err) {
      console.error("Fetch cart error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (cartId, quantity) => {
    const token = await user.getIdToken();

    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart/${cartId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity }),
    });

    fetchCart();
  };

  const removeItem = async (cartId) => {
  const token = await user.getIdToken();

  await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/cart/${cartId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  fetchCart();
};

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleCheckout = () => {
    if (!window.Razorpay) {
      alert("Razorpay not loaded");
      return;
    }

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!razorpayKey) {
      alert("Razorpay key missing");
      return;
    }

    const options = {
      key: razorpayKey,
      amount: subtotal * 100,
      currency: "INR",
      name: "PebbleCo",
      description: "Order Payment",
      handler: function (response) {
        console.log("Payment success:", response);
        alert("Payment successful");
      },
      theme: {
        color: "#fdd2dc",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // 🔹 UI STATES
  if (loading) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <p>Loading products...</p>
    </div>
  );
}


  if (!user) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <p>Please login to view cart.</p>
    </div>
  );
}

  return (
    <div className="cart-page">
      <h1 className="cart-title">Your Cart</h1>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Add some cute PebbleCo goodies 🌸</p>

          <Link to="/" className="continue-btn">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <img
                  src={item.product.images?.[0]}
                  alt={item.product.name}
                  className="cart-item-image"
                />

                <div className="cart-item-info">
                  <div className="cart-item-name">{item.product.name}</div>
                  <div className="cart-item-price">₹{item.product.price}</div>
                </div>

                <div className="cart-item-qty">
                  <button
                    onClick={() => {
                      if (item.quantity > 1)
                        updateQty(item.id, item.quantity - 1);
                    }}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)}>
                    +
                  </button>
                </div>

                <div className="cart-item-total">
                  ₹{item.product.price * item.quantity}
                </div>

                <button
                  className="cart-item-remove"
                  onClick={() => removeItem(item.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Cart Totals</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="summary-total">
              <span>Total</span>
              <span>₹{subtotal}</span>
            </div>

            <label className="terms">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                I agree to the{" "}
                <a
                  href="/terms"
                  className="terms-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms & Conditions
                </a>
              </span>
            </label>

            <button
              className="checkout-btn"
              disabled={!agreed}
              onClick={() => navigate("/checkout/delivery")}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
