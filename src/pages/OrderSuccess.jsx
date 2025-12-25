import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { supabase } from "../supabaseClient";

function OrderSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.uid)
        .single();

      if (error || !data) {
        navigate("/");
        return;
      }

      setOrder(data);
      setLoading(false);
    };

    fetchOrder();
  }, []);

  if (loading) {
    return <p style={{ padding: "60px" }}>Loading order...</p>;
  }

  return (
    <div style={{ padding: "60px", textAlign: "center" }}>
      <h1>🎉 Order Placed Successfully!</h1>

      <p>
        <strong>Order ID:</strong> {order.id}
      </p>

      <p>
        <strong>Total Paid:</strong> ₹{order.total}
      </p>

      <p>
        <strong>Status:</strong> {order.payment_status}
      </p>

      <Link
        to="/"
        style={{
          marginTop: "30px",
          display: "inline-block",
          padding: "10px 18px",
          borderRadius: "20px",
          background: "#fdd2dc",
          color: "#000",
          textDecoration: "none",
        }}
      >
        Continue Shopping
      </Link>
    </div>
  );
}

export default OrderSuccess;
