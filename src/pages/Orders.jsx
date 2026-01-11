import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { supabase } from "../supabaseClient";
import { onAuthStateChanged } from "firebase/auth";
import "../styles/orders.css";

function Orders() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔐 Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 📦 Fetch orders
  useEffect(() => {
    if (user) fetchOrders(user.uid);
    else setLoading(false);
  }, [user]);

  const fetchOrders = async (userId) => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        total,
        status,
        payment_status,
        delivery_type,
        created_at,
        order_items (
          id,
          quantity,
          price_at_purchase,
          products (
            name
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch orders error:", error);
    } else {
      setOrders(data);
    }

    setLoading(false);
  };

  // 🌀 UI STATES
  if (loading) {
    return <p style={{ padding: "40px" }}>Loading orders...</p>;
  }

  if (!user) {
    return <p style={{ padding: "40px" }}>Please login to view orders.</p>;
  }

  return (
    <div className="orders-page">
      <h1>Your Orders</h1>

      {orders.length === 0 ? (
        <p>No orders placed yet.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-card" key={order.id}>
              {/* ORDER META */}
              <div className="order-row">
                <span className="label">Order ID</span>
                <span>{order.id.slice(0, 8).toUpperCase()}</span>
              </div>

              <div className="order-row">
                <span className="label">Date</span>
                <span>
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="order-row">
                <span className="label">Total</span>
                <span>₹{order.total}</span>
              </div>

              <div className="order-row">
                <span className="label">Payment</span>
                <span className="paid">
                  {order.payment_status || "Paid"}
                </span>
              </div>

              <div className="order-row">
                <span className="label">Order Status</span>
                <span className="status">
                  {order.status || "Processing"}
                </span>
              </div>

              <div className="order-row">
                <span className="label">Delivery Type</span>
                <span className="delivery">
                  {order.delivery_type === "shipping"
                    ? "Home Delivery"
                    : "Pickup"}
                </span>
              </div>

              {/* ITEMS */}
              <div className="order-items">
                <h4>Items</h4>

                {order.order_items.map((item) => (
                  <div className="order-item" key={item.id}>
                    <span>
                      {item.products?.name} × {item.quantity}
                    </span>
                    
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
