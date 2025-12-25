import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { supabase } from "../supabaseClient";
import { onAuthStateChanged } from "firebase/auth";
import "../styles/adminOrders.css";

function AdminOrders() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

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
      fetchOrders();
    });

    return () => unsub();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setOrders(data || []);
    setLoading(false);
  };

  const updateOrder = async (orderId, updates) => {
    await supabase.from("orders").update(updates).eq("id", orderId);
    fetchOrders();
  };

  /* ---------------- UI STATES ---------------- */

  if (loading) return <p style={{ padding: 40 }}>Loading admin panel…</p>;

  if (unauthorized)
    return <p style={{ padding: 40 }}>❌ Access denied</p>;

  return (
    <div className="admin-orders">
      <h1>Admin – Orders</h1>

      {orders.length === 0 && <p>No orders found.</p>}

      {orders.map((o) => (
        <div className="admin-order-card" key={o.id}>
          <p><b>Order ID:</b> {o.id}</p>
          <p><b>User ID:</b> {o.user_id}</p>
          <p><b>Total:</b> ₹{o.total}</p>
          <p><b>Payment:</b> {o.payment_status}</p>
          <p><b>Delivery:</b> {o.delivery_type}</p>
          <p><b>Order Status:</b> {o.status}</p>

          {o.shipping_address && (
            <>
              <p><b>Shipping Address:</b></p>
              <pre>{JSON.stringify(o.shipping_address, null, 2)}</pre>
            </>
          )}

          {o.delivery_type === "shipping" && (
            <>
              <p><b>Shiprocket Order:</b> {o.shiprocket_order_id || "—"}</p>
              <p><b>Courier:</b> {o.courier_name || "—"}</p>
              <p><b>AWB:</b> {o.awb_code || "—"}</p>
              <p><b>Shipment Status:</b> {o.shipment_status || "—"}</p>
            </>
          )}

          <div className="admin-actions">
            <select
              value={o.status}
              onChange={(e) =>
                updateOrder(o.id, { status: e.target.value })
              }
            >
              <option value="pending">Pending</option>
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
