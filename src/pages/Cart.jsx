import { useEffect, useState } from "react";
import "../styles/cart.css";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { supabase } from "../supabaseClient";
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
    const { data, error } = await supabase
      .from("cart")
      .select(`
        id,
        quantity,
        product:products (
          id,
          name,
          price,
          images
        )
      `)
      .eq("user_id", user.uid);

    if (error) {
      console.error("Fetch cart error:", error);
    } else {
      setCartItems(data);
    }

    setLoading(false);
  };

  const increaseQty = async (cartId, currentQty) => {
    await supabase
      .from("cart")
      .update({ quantity: currentQty + 1 })
      .eq("id", cartId);

    fetchCart();
  };

  const decreaseQty = async (cartId, currentQty) => {
    if (currentQty <= 1) return;

    await supabase
      .from("cart")
      .update({ quantity: currentQty - 1 })
      .eq("id", cartId);

    fetchCart();
  };

  const removeItem = async (cartId) => {
    await supabase.from("cart").delete().eq("id", cartId);
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

    const options = {
      key: "rzp_test_1234567890",
      amount: subtotal * 100,
      currency: "INR",
      name: "PebbleCo",
      description: "Order Payment",
      handler: function () {
        alert("Payment successful (test)");
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
    return <p style={{ padding: "40px" }}>Loading cart...</p>;
  }

  if (!user) {
    return <p style={{ padding: "40px" }}>Please login to view cart.</p>;
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
                  <div className="cart-item-name">
                    {item.product.name}
                  </div>
                  <div className="cart-item-price">
                    ₹{item.product.price}
                  </div>
                </div>

                <div className="cart-item-qty">
                  <button
                    onClick={() =>
                      decreaseQty(item.id, item.quantity)
                    }
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      increaseQty(item.id, item.quantity)
                    }
                  >
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
                <a href="#" className="terms-link">
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
