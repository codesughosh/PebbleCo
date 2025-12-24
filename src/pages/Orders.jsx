import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { supabase } from "../supabaseClient";
import "../styles/orders.css";
import { onAuthStateChanged } from "firebase/auth";

function Orders() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders(user.uid);
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrders = async (userId) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch orders error:", error);
    } else {
      setOrders(data);
    }

    setLoading(false);
  };

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
                <span className="paid">Paid</span>
              </div>

              <div className="order-row">
                <span className="label">Order Status</span>
                <span className="status">
                  {order.status || "Processing"}
                </span>
              </div>

              <div className="order-row">
                <span className="label">Tracking</span>
                <span className="tracking">Not shipped yet</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
