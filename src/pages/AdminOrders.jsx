import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import "../styles/adminOrders.css";

function AdminOrders() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const API_BASE = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
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
    });

    return () => unsub();
  }, []);

  const fetchOrders = async (u) => {
    if (!u) return;

    const token = await u.getIdToken();

    const res = await fetch(`${API_BASE}/api/admin/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setOrders(data || []);
    setLoading(false);
  };

  const updateOrder = async (orderId, updates) => {
    const token = await user.getIdToken();

    await fetch(`${API_BASE}/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    fetchOrders(user);
  };

  const formatEmpty = (value) => value || "--";
  const formatPrice = (value) => `\u20B9${value}`;

  if (loading) return <p style={{ padding: 40 }}>Loading admin panel...</p>;

  if (unauthorized) return <p style={{ padding: 40 }}>Access denied</p>;

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
          {o.payment_status === "pending_verification" && (
            <p className="admin-upi-id">
              <b>UPI Transaction ID:</b> {formatEmpty(o.payment_id)}
            </p>
          )}
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

          <div className="admin-actions">
            <select
              value={o.payment_status || "pending"}
              onChange={(e) => {
                const paymentStatus = e.target.value;
                updateOrder(o.id, {
                  payment_status: paymentStatus,
                  ...(paymentStatus === "success" ? { status: "paid" } : {}),
                });
              }}
            >
              <option value="pending">Payment pending</option>
              <option value="pending_verification">Pending verification</option>
              <option value="success">Paid</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={o.status || "pending"}
              onChange={(e) => updateOrder(o.id, { status: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>

            {o.delivery_type === "shipping" && (
              <select
                value={o.shipment_status || ""}
                onChange={(e) =>
                  updateOrder(o.id, { shipment_status: e.target.value })
                }
              >
                <option value="">Shipment status</option>
                <option value="created">Created</option>
                <option value="picked">Picked</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminOrders;
