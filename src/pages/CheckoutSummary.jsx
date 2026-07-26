import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  PackageCheck,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { supabase } from "../supabaseClient";
import "../styles/checkout.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const UPI_ID = (import.meta.env.VITE_UPI_ID || "").trim();
const UPI_PAYEE_NAME = (import.meta.env.VITE_UPI_PAYEE_NAME || "PebbleCo").trim();

function CheckoutSummary() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [copied, setCopied] = useState(false);

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

  const upiUri = useMemo(() => {
    if (!UPI_ID) return "";

    const params = new URLSearchParams({
      pa: UPI_ID,
      pn: UPI_PAYEE_NAME,
      am: Number(total || 0).toFixed(2),
      cu: "INR",
      tn: "PebbleCo order payment",
    });

    return `upi://pay?${params.toString()}`;
  }, [total]);

  const qrCodeUrl = upiUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=14&data=${encodeURIComponent(
        upiUri,
      )}`
    : "";

  const copyUpiId = async () => {
    if (!UPI_ID) return;

    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      alert(`UPI ID: ${UPI_ID}`);
    }
  };

  const handleManualUpiSubmit = async () => {
    if (isSubmitting) return;

    const transactionId = upiTransactionId.trim();

    if (!UPI_ID) {
      alert("UPI ID is not configured yet");
      return;
    }

    if (transactionId.length < 6) {
      alert("Please paste a valid UPI Transaction ID / UTR");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await user.getIdToken();

      const res = await fetch(`${BACKEND_URL}/api/manual-upi-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: total,
          customerEmail: user.email,
          deliveryType,
          shippingAddress: deliveryType === "shipping" ? address : null,
          inhandDetails: deliveryType === "inhand" ? inhandDetails : null,
          upiTransactionId: transactionId,
          cartItems: cartItems.map((item) => ({
            product_id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.dbOrderId) {
        throw new Error(data.error || "Could not create order");
      }

      navigate(`/order-success/${data.dbOrderId}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not submit payment details");
      setIsSubmitting(false);
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
          <p>Pay with UPI, then paste your transaction ID for verification.</p>
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

        <div className="upi-payment-box">
          <div className="upi-payment-head">
            <QrCode size={22} strokeWidth={1.8} />
            <div>
              <h2>Pay with UPI</h2>
              <p>Scan the QR or open your UPI app, then submit the transaction ID.</p>
            </div>
          </div>

          {UPI_ID ? (
            <>
              <div className="upi-qr-wrap">
                <img src={qrCodeUrl} alt={`UPI QR code for ${UPI_PAYEE_NAME}`} />
              </div>

              <div className="upi-id-row">
                <span>{UPI_ID}</span>
                <button type="button" onClick={copyUpiId}>
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <a className="upi-open-link" href={upiUri}>
                <ExternalLink size={16} strokeWidth={2} />
                Open UPI App
              </a>
            </>
          ) : (
            <div className="upi-config-warning">
              Add <strong>VITE_UPI_ID</strong> to show your QR code here.
            </div>
          )}

          <label className="upi-transaction-field">
            <span>UPI Transaction ID / UTR</span>
            <input
              type="text"
              value={upiTransactionId}
              onChange={(e) => setUpiTransactionId(e.target.value)}
              placeholder="Paste transaction ID after payment"
            />
          </label>

          <p className="upi-note">
            <ShieldCheck size={15} strokeWidth={1.8} />
            Your order will be marked pending until PebbleCo verifies the payment.
          </p>
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
            onClick={handleManualUpiSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin" />
                Submitting
              </>
            ) : (
              <>
                <ShieldCheck size={16} strokeWidth={2} />
                Submit for Verification
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default CheckoutSummary;
