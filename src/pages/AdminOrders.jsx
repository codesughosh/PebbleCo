import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Check, Download, Loader2 } from "lucide-react";
import { auth } from "../firebase";
import { PageLoader } from "../components/Skeleton";
import "../styles/adminOrders.css";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

function AdminOrders() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [actionFeedback, setActionFeedback] = useState({});
  const feedbackTimersRef = useRef({});

  const fetchOrders = useCallback(async (u) => {
    if (!u) return;

    const token = await u.getIdToken();

    const res = await fetch(`${API_BASE}/api/admin/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setAdminError(data.error || "Could not load admin orders.");
      setUnauthorized(res.status === 401 || res.status === 403);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        const tokenResult = await u.getIdTokenResult(true);

        if (!tokenResult.claims.admin) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        setUser(u);
        fetchOrders(u);
      } catch (err) {
        console.error("Admin auth check failed:", err);
        setAdminError("Could not verify admin access.");
        setUnauthorized(true);
        setLoading(false);
      }
    });

    return () => unsub();
  }, [fetchOrders]);

  useEffect(() => {
    const timers = feedbackTimersRef.current;

    return () => {
      Object.values(timers).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const setFeedbackForAction = (feedbackKey, status) => {
    if (feedbackTimersRef.current[feedbackKey]) {
      window.clearTimeout(feedbackTimersRef.current[feedbackKey]);
    }

    setActionFeedback((current) => ({
      ...current,
      [feedbackKey]: status,
    }));

    if (status === "success") {
      feedbackTimersRef.current[feedbackKey] = window.setTimeout(() => {
        setActionFeedback((current) => {
          const next = { ...current };
          delete next[feedbackKey];
          return next;
        });
      }, 1600);
    }
  };

  const getFeedbackForAction = (orderId, actionName) =>
    actionFeedback[`${orderId}:${actionName}`] || "idle";

  const renderActionFeedback = (orderId, actionName) => {
    const status = getFeedbackForAction(orderId, actionName);

    if (status === "idle") return null;

    return (
      <span
        className={`admin-action-feedback ${
          status === "success" ? "success" : "loading"
        }`}
        role="status"
        aria-live="polite"
      >
        {status === "success" ? (
          <Check size={14} strokeWidth={2.2} />
        ) : (
          <Loader2 size={14} strokeWidth={2} className="admin-spin" />
        )}
        {status === "success" ? "Saved" : "Saving"}
      </span>
    );
  };

  const updateOrder = async (orderId, updates, actionName) => {
    const feedbackKey = `${orderId}:${actionName}`;
    setFeedbackForAction(feedbackKey, "loading");

    try {
      const token = await user.getIdToken();

      const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedbackForAction(feedbackKey, "idle");
        alert(data.error || "Failed to update order");
        return;
      }

      if (data.confirmationEmailError) {
        alert(data.confirmationEmailError);
      }

      await fetchOrders(user);
      setFeedbackForAction(feedbackKey, "success");
    } catch (error) {
      console.error("Admin order update failed:", error);
      setFeedbackForAction(feedbackKey, "idle");
      alert("Failed to update order");
    }
  };

  const downloadReceipt = async (orderId) => {
    const feedbackKey = `${orderId}:receipt`;
    setFeedbackForAction(feedbackKey, "loading");

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/invoice/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Could not download receipt");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `PebbleCo-Receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setFeedbackForAction(feedbackKey, "success");
    } catch (error) {
      console.error("Admin receipt download failed:", error);
      setFeedbackForAction(feedbackKey, "idle");
      alert("Could not download receipt");
    }
  };

  const formatEmpty = (value) => value || "--";
  const formatPrice = (value) =>
    value === null || value === undefined ? "--" : `\u20B9${value}`;
  const formatDateTime = (value) =>
    value
      ? new Date(value).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "--";
  const getOrderItemName = (item) =>
    item.product_name || item.products?.name || item.name || "Product";

  if (loading) return <PageLoader label="Loading admin panel..." />;

  if (unauthorized) {
    return (
      <div className="admin-state">
        <div className="admin-state-card">
          <p>Access denied</p>
          {adminError && <span>{adminError}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <h1>Admin - Orders</h1>

      {orders.length === 0 && <p>No orders found.</p>}

      {orders.map((o) => (
        <div className="admin-order-card" key={o.id}>
          <p>
            <b>Order ID:</b> {o.id}
          </p>
          <p>
            <b>User ID:</b> {o.user_id}
          </p>
          <p>
            <b>Date & Time:</b> {formatDateTime(o.created_at)}
          </p>
          <p>
            <b>Customer Name:</b> {formatEmpty(o.customer_name)}
          </p>
          <p>
            <b>Email:</b> {formatEmpty(o.customer_email)}
          </p>
          <p>
            <b>Phone:</b> {formatEmpty(o.customer_phone)}
          </p>
          <p>
            <b>Total:</b> {formatPrice(o.total)}
          </p>
          <p>
            <b>Payment:</b> {formatEmpty(o.payment_status)}
          </p>
          <p className="admin-upi-id">
            <b>Transaction ID:</b> {formatEmpty(o.payment_id)}
          </p>
          <p>
            <b>Delivery:</b> {o.delivery_type}
          </p>
          <p>
            <b>Order Status:</b> {o.status}
          </p>

          {o.shipping_address && (
            <>
              <p>
                <b>Shipping Address:</b>
              </p>
              <pre>{JSON.stringify(o.shipping_address, null, 2)}</pre>
            </>
          )}

          {o.delivery_type === "shipping" && (
            <>
              <p>
                <b>Shiprocket Order:</b> {formatEmpty(o.shiprocket_order_id)}
              </p>
              <p>
                <b>Courier:</b> {formatEmpty(o.courier_name)}
              </p>
              <p>
                <b>AWB:</b> {formatEmpty(o.awb_code)}
              </p>
              <p>
                <b>Shipment Status:</b> {formatEmpty(o.shipment_status)}
              </p>
            </>
          )}

          <div className="admin-order-items">
            <b>Ordered Items:</b>
            {o.order_items?.length ? (
              <div className="admin-order-items-list">
                {o.order_items.map((item) => (
                  <div className="admin-order-item" key={item.id}>
                    <span>{getOrderItemName(item)}</span>
                    <span>
                      x {item.quantity} · {formatPrice(item.price_at_purchase)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No items found.</p>
            )}
          </div>

          <div className="admin-actions">
            <div className="admin-action-field">
              <button
                type="button"
                className="admin-receipt-btn"
                disabled={getFeedbackForAction(o.id, "receipt") === "loading"}
                onClick={() => downloadReceipt(o.id)}
              >
                <Download size={15} strokeWidth={2} />
                Receipt
              </button>
              {renderActionFeedback(o.id, "receipt")}
            </div>

            <div className="admin-action-field">
              <select
                value={o.payment_status || "pending"}
                disabled={getFeedbackForAction(o.id, "payment") === "loading"}
                onChange={(e) => {
                  const paymentStatus = e.target.value;
                  updateOrder(
                    o.id,
                    {
                      payment_status: paymentStatus,
                      ...(paymentStatus === "success" ? { status: "paid" } : {}),
                    },
                    "payment",
                  );
                }}
              >
                <option value="pending">Payment pending</option>
                <option value="pending_verification">Pending verification</option>
                <option value="success">Paid</option>
                <option value="rejected">Rejected</option>
              </select>
              {renderActionFeedback(o.id, "payment")}
            </div>

            <div className="admin-action-field">
              <select
                value={o.status || "pending"}
                disabled={getFeedbackForAction(o.id, "status") === "loading"}
                onChange={(e) =>
                  updateOrder(o.id, { status: e.target.value }, "status")
                }
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
              {renderActionFeedback(o.id, "status")}
            </div>

            {o.delivery_type === "shipping" && (
              <div className="admin-action-field">
                <select
                  value={o.shipment_status || ""}
                  disabled={getFeedbackForAction(o.id, "shipment") === "loading"}
                  onChange={(e) =>
                    updateOrder(
                      o.id,
                      { shipment_status: e.target.value },
                      "shipment",
                    )
                  }
                >
                  <option value="">Shipment status</option>
                  <option value="created">Created</option>
                  <option value="picked">Picked</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                </select>
                {renderActionFeedback(o.id, "shipment")}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminOrders;
