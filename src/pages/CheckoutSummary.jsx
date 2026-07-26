import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, Loader2, PackageCheck } from "lucide-react";
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
  const [isPaying, setIsPaying] = useState(false);

  const deliveryType = localStorage.getItem("deliveryType");
  const address = JSON.parse(localStorage.getItem("shippingAddress"));
  const inhandDetails = JSON.parse(localStorage.getItem("inhandDetails"));

  useEffect(() => {
    const savedDeliveryType = localStorage.getItem("deliveryType");

    if (!savedDeliveryType) {
      navigate("/checkout/address");
      return;
    }

    if (savedDeliveryType === "shipping") {
      const savedAddress = JSON.parse(localStorage.getItem("shippingAddress"));

      if (!savedAddress || savedAddress.locationResolved !== true) {
        navigate("/checkout/address");
      }
    }
  }, [navigate]);

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

  const shippingFee = deliveryType === "shipping" ? 60 : 0;
  const total = subtotal + shippingFee;
  const formatPrice = (value) => `\u20B9${value}`;

  const handlePayment = async () => {
    if (isPaying) return;

    if (!window.Razorpay) {
      alert("Razorpay not loaded");
      return;
    }

    try {
      setIsPaying(true);

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
                  deliveryType === "inhand" ? inhandDetails?.name : address?.name,
                customerPhone:
                  deliveryType === "inhand" ? inhandDetails?.phone : address?.phone,
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
    return (
      <div className="checkout-state">
        <div className="checkout-state-card">
          <Loader2 size={20} className="spin" />
          <p>Loading summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <section className="checkout-shell">
        <div className="checkout-head">
          <span className="checkout-step">Step 3 of 3</span>
          <h1>Order Summary</h1>
          <p>Review your items and complete your payment.</p>
        </div>

        <div className="summary-box">
          <div className="summary-box-head">
            <PackageCheck size={22} strokeWidth={1.8} />
            <div>
              <h2>Items</h2>
              <p>{cartItems.length} item{cartItems.length === 1 ? "" : "s"}</p>
            </div>
          </div>

          {cartItems.map((item) => (
            <div key={item.id} className="summary-row item-row">
              <span>
                {item.product.name} <small>x {item.quantity}</small>
              </span>
              <span>{formatPrice(item.product.price * item.quantity)}</span>
            </div>
          ))}

          <div className="summary-divider" />

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>{shippingFee === 0 ? "Free" : formatPrice(shippingFee)}</span>
          </div>

          <div className="summary-total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <div className="checkout-actions split">
          <button
            type="button"
            className="checkout-secondary"
            onClick={() => navigate("/checkout/address")}
          >
            <ArrowLeft size={16} strokeWidth={2} />
            Back
          </button>

          <button
            type="button"
            className="checkout-continue"
            onClick={handlePayment}
            disabled={isPaying}
          >
            {isPaying ? (
              <>
                <Loader2 size={16} className="spin" />
                Processing Payment
              </>
            ) : (
              <>
                <CreditCard size={16} strokeWidth={2} />
                Pay {formatPrice(total)}
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default CheckoutSummary;
