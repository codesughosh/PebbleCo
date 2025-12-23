import { useState } from "react";
import "../styles/cart.css";
import { Link } from "react-router-dom";

function Cart() {

  console.log("CART COMPONENT RENDERED");
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Pearl Bracelet",
      price: 399,
      qty: 1,
    },
    {
      id: 2,
      name: "Pink Charm Necklace",
      price: 499,
      qty: 1,
    },
  ]);

  const [agreed, setAgreed] = useState(false);

  const increaseQty = (id) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id && item.qty > 1 ? { ...item, qty: item.qty - 1 } : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const handleCheckout = () => {
  if (!window.Razorpay) {
    alert("Razorpay not loaded");
    return;
  }

  const options = {
    key: "rzp_test_1234567890", // dummy key for now
    amount: subtotal * 100,
    currency: "INR",
    name: "PebbleCo",
    description: "Order Payment",
    prefill: {
      email: "pebblecobusiness@gmail.com",
    },
    handler: function (response) {
      alert("Payment successful (test)");
      console.log(response);
    },
    theme: {
      color: "#fdd2dc",
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};


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
          {/* LEFT */}
          <div className="cart-items">
            {cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-image">🌸</div>

                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">₹{item.price}</div>
                </div>

                <div className="cart-item-qty">
                  <button onClick={() => decreaseQty(item.id)}>-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => increaseQty(item.id)}>+</button>
                </div>

                <div className="cart-item-total">₹{item.price * item.qty}</div>

                <button
                  className="cart-item-remove"
                  onClick={() => removeItem(item.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* RIGHT */}
          <div className="cart-summary">
            <h2>Cart Totals</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="summary-row">
              <span>Shipping</span>
              <span>Free</span>
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

            <button className="checkout-btn" onClick={handleCheckout}>
  Proceed to Checkout
</button>

          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
