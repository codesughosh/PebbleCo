import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { CalendarDays, PackageCheck, ReceiptText, ShoppingBag, Truck } from "lucide-react";
import { auth } from "../firebase";
import "../styles/orders.css";

function Orders() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    const token = await user.getIdToken();

    const res = await fetch(`${API_BASE}/api/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  const formatPrice = (value) => `\u20B9${value}`;

  if (loading) {
    return (
      <div className="orders-state">
        <div className="orders-state-card">
          <PackageCheck size={24} strokeWidth={1.8} />
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="orders-state">
        <div className="orders-state-card">
          <ShoppingBag size={24} strokeWidth={1.8} />
          <p>Please login to view orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <section className="orders-shell">
        <div className="orders-head">
          <span className="orders-kicker">History</span>
          <h1>Your Orders</h1>
          <p>Track recent PebbleCo purchases and delivery details.</p>
        </div>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <ShoppingBag size={32} strokeWidth={1.7} />
            <h2>No orders placed yet.</h2>
            <p>Your finished purchases will appear here.</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card-head">
                  <div className="order-icon">
                    <ReceiptText size={21} strokeWidth={1.8} />
                  </div>
                  <div>
                    <span className="label">Order ID</span>
                    <h2>{order.id.slice(0, 8).toUpperCase()}</h2>
                  </div>
                </div>

                <div className="order-grid">
                  <div className="order-row">
                    <span className="label">
                      <CalendarDays size={15} strokeWidth={1.8} />
                      Date
                    </span>
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="order-row">
                    <span className="label">Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>

                  <div className="order-row">
                    <span className="label">Payment</span>
                    <span className="paid">{order.payment_status || "Paid"}</span>
                  </div>

                  <div className="order-row">
                    <span className="label">Order Status</span>
                    <span className="status">{order.status || "Processing"}</span>
                  </div>

                  <div className="order-row">
                    <span className="label">
                      <Truck size={15} strokeWidth={1.8} />
                      Delivery
                    </span>
                    <span className="delivery">
                      {order.delivery_type === "shipping" ? "Home Delivery" : "Pickup"}
                    </span>
                  </div>
                </div>

                <div className="order-items">
                  <h4>Items</h4>

                  {(order.order_items || []).map((item) => (
                    <div className="order-item" key={item.id}>
                      <span>{item.products?.name}</span>
                      <span>x {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Orders;
