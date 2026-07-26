import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowRight,
  Check,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { auth } from "../firebase";
import { CartSkeleton } from "../components/Skeleton";
import "../styles/cart.css";

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCartItem, setActiveCartItem] = useState(null);
  const [successCartItem, setSuccessCartItem] = useState(null);
  const [checkoutState, setCheckoutState] = useState("idle");
  const [agreed, setAgreed] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(true);
      setUser(currentUser);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const fetchCart = useCallback(async ({ useSkeleton = false } = {}) => {
    if (!user) return;

    if (useSkeleton) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const token = await user.getIdToken();

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Could not fetch cart");
      }

      const data = await res.json();
      setCartItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch cart error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    fetchCart({ useSkeleton: true });
  }, [authReady, fetchCart, user]);

  const updateQty = async (cartId, quantity) => {
    if (refreshing) return;

    try {
      setActiveCartItem(cartId);
      const token = await user.getIdToken();

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart/${cartId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) {
        throw new Error("Could not update item quantity");
      }

      await fetchCart();
      setSuccessCartItem(cartId);
      window.setTimeout(() => setSuccessCartItem(null), 760);
    } catch (err) {
      console.error("Update cart quantity error:", err);
      alert("Could not update cart. Please try again.");
    } finally {
      setActiveCartItem(null);
    }
  };

  const removeItem = async (cartId) => {
    if (refreshing) return;

    try {
      setActiveCartItem(cartId);
      const token = await user.getIdToken();

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart/${cartId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Could not remove item");
      }

      await fetchCart();
    } catch (err) {
      console.error("Remove cart item error:", err);
      alert("Could not remove item. Please try again.");
    } finally {
      setActiveCartItem(null);
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const formatPrice = (value) => `\u20B9${value}`;

  const handleProceedToCheckout = () => {
    if (!agreed || refreshing || checkoutState !== "idle") return;

    setCheckoutState("loading");

    window.setTimeout(() => {
      setCheckoutState("success");
      window.setTimeout(() => navigate("/checkout/delivery"), 420);
    }, 220);
  };

  if (!authReady || loading) {
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
      <section className="cart-shell" aria-busy={refreshing}>
        <div className="cart-page-head">
          <span className="cart-kicker">Checkout</span>
          <h1 className="cart-title">Your Cart</h1>
          <p>{cartItems.length} item{cartItems.length === 1 ? "" : "s"} ready for checkout.</p>
          {refreshing && (
            <div className="cart-loading-chip" role="status" aria-live="polite">
              <Loader2 size={15} className="cart-spin" />
              Updating cart
            </div>
          )}
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
              {cartItems.map((item) => {
                const isItemLoading = activeCartItem === item.id;
                const isItemSuccess = successCartItem === item.id;

                return (
                  <article
                    className={`cart-item ${
                      isItemLoading || isItemSuccess ? "updating" : ""
                    } ${isItemSuccess ? "updated" : ""}`}
                    key={item.id}
                  >
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
                        disabled={refreshing || item.quantity <= 1}
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
                        disabled={refreshing}
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
                      disabled={refreshing}
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={17} strokeWidth={1.9} />
                    </button>

                    {(isItemLoading || isItemSuccess) && (
                      <div
                        className={`cart-item-loading ${
                          isItemSuccess ? "success" : ""
                        }`}
                        role="status"
                        aria-live="polite"
                      >
                        {isItemSuccess ? (
                          <Check size={18} strokeWidth={2.2} />
                        ) : (
                          <Loader2 size={18} className="cart-spin" />
                        )}
                        <span>{isItemSuccess ? "Updated" : "Updating"}</span>
                      </div>
                    )}
                  </article>
                );
              })}
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
                className={`checkout-btn feedback-action is-${
                  checkoutState === "success" ? "success" : checkoutState
                }`}
                disabled={!agreed || refreshing || checkoutState !== "idle"}
                onClick={handleProceedToCheckout}
                aria-busy={refreshing || checkoutState === "loading"}
                aria-live="polite"
              >
                {refreshing ? (
                  <>
                    <Loader2 size={16} className="cart-spin" />
                    Updating Cart
                  </>
                ) : checkoutState === "loading" ? (
                  <>
                    <span className="feedback-spinner" aria-hidden="true" />
                    Opening checkout
                  </>
                ) : checkoutState === "success" ? (
                  <>
                    <Check size={16} strokeWidth={2.2} />
                    Ready
                  </>
                ) : (
                  <>
                    Proceed to Checkout
                    <ArrowRight size={16} strokeWidth={2} />
                  </>
                )}
              </button>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}

export default Cart;
