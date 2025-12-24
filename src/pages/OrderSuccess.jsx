import { Link } from "react-router-dom";

function OrderSuccess() {
  return (
    <div style={{ padding: "60px", textAlign: "center" }}>
      <h1>🎉 Order Placed Successfully!</h1>
      <p>Thank you for shopping with PebbleCo 💖</p>

      <Link to="/" style={{ marginTop: "20px", display: "inline-block" }}>
        Continue Shopping
      </Link>
    </div>
  );
}

export default OrderSuccess;
