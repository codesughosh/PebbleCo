import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { auth } from "../firebase";
import { CartSkeleton } from "../components/Skeleton";
import "../styles/cart.css";

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

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

    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart/${cartId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchCart();
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const formatPrice = (value) => `\u20B9${value}`;

  if (loading) {
    return <CartSkeleton />;
  }

  if (!user) {
    return (
      <div className="cart-state">
        <div className="cart-state-card">
          <ShoppingBag size={24} strokeWidth={1.8} />
          <p>Please login to view cart.</p>
          <Link to="/login" className="continue-btn">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <section className="cart-shell">
        <div className="cart-page-head">
          <span className="cart-kicker">Checkout</span>
          <h1 className="cart-title">Your Cart</h1>
          <p>{cartItems.length} item{cartItems.length === 1 ? "" : "s"} ready for checkout.</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <ShoppingBag size={34} strokeWidth={1.7} />
            <h2>Your cart is empty</h2>
            <p>Add some cute PebbleCo goodies.</p>

            <Link to="/" className="continue-btn">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {cartItems.map((item) => (
                <article className="cart-item" key={item.id}>
                  <img
                    src={item.product.images?.[0] || "/placeholder.png"}
                    alt={item.product.name}
                    className="cart-item-image"
                  />

                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.product.name}</div>
                    <div className="cart-item-price">{formatPrice(item.product.price)}</div>
                  </div>

                  <div className="cart-item-qty" aria-label={`Quantity for ${item.product.name}`}>
                    <button
                      type="button"
                      aria-label={`Decrease quantity for ${item.product.name}`}
                      disabled={item.quantity <= 1}
                      onClick={() => {
                        if (item.quantity > 1) {
                          updateQty(item.id, item.quantity - 1);
                        }
                      }}
                    >
                      <Minus size={15} strokeWidth={2.4} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase quantity for ${item.product.name}`}
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                    >
                      <Plus size={15} strokeWidth={2.4} />
                    </button>
                  </div>

                  <div className="cart-item-total">
                    {formatPrice(item.product.price * item.quantity)}
                  </div>

                  <button
                    type="button"
                    className="cart-item-remove"
                    aria-label={`Remove ${item.product.name}`}
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={17} strokeWidth={1.9} />
                  </button>
                </article>
              ))}
            </div>

            <aside className="cart-summary">
              <div className="summary-head">
                <ShieldCheck size={20} strokeWidth={1.8} />
                <h2>Cart Totals</h2>
              </div>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="summary-total">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
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
                type="button"
                className="checkout-btn"
                disabled={!agreed}
                onClick={() => navigate("/checkout/delivery")}
              >
                Proceed to Checkout
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}

export default Cart;
