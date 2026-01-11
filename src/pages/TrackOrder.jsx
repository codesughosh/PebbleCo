import { useState, useEffect } from "react";
import "../styles/trackOrder.css";
import OrderTimeline from "../components/OrderTimeline";
import "../styles/orderTimeline.css";

function mapStatus(status) {
  if (!status || status === 0) return "packed";

  const s = String(status).toLowerCase();

  if (s.includes("pickup")) return "packed";
  if (s.includes("in transit")) return "shipped";
  if (s.includes("out for delivery")) return "shipped";
  if (s.includes("delivered")) return "delivered";

  return "packed";
}


const API_BASE = import.meta.env.VITE_BACKEND_URL;

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState("");
console.log("API BASE =", API_BASE);

  const fetchTracking = async (id = orderId) => {
    if (!id) {
      setError("Please enter your Order ID");
      return;
    }

    setLoading(true);
    setError("");
    setTracking(null);

    try {
      const res = await fetch(`${API_BASE}/api/track/${id}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Tracking not available yet");
      }

      setTracking(data.tracking);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get("orderId");

    if (idFromUrl) {
      setOrderId(idFromUrl);
      fetchTracking(idFromUrl);
    }
  }, []);

  return (
    <div className="track-container">
      <h1>Track Your Order</h1>
      <p className="subtitle">
        Enter your Order ID to check the latest delivery status.
      </p>

      <div className="track-box">
        <input
          type="text"
          placeholder="Order ID (example: 7c2f...)"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <button onClick={() => fetchTracking()} disabled={loading}>
          {loading ? "Checking…" : "Track Order"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {tracking && (
        <div className="tracking-card">
          <h3>Shipment Status</h3>

          <div className="tracking-info">
            <p>
              <strong>Status:</strong>{" "}
              {tracking.tracking_data?.shipment_status || "Unknown"}
            </p>
            <p>
              <strong>Courier:</strong>{" "}
              {tracking.tracking_data?.courier_name || "—"}
            </p>
            <p>
              <strong>AWB:</strong>{" "}
              {tracking.tracking_data?.awb_code || "—"}
            </p>
          </div>

          

          <OrderTimeline
  currentStatus={mapStatus(tracking?.tracking_data?.shipment_status)}
/>



          <div className="timeline">
            {tracking.tracking_data?.shipment_track?.length ? (
              tracking.tracking_data.shipment_track.map((event, i) => (
                <div key={i} className="timeline-item">
                  <span className="dot" />
                  <div>
                    <p className="event">{event.status}</p>
                    <p className="date">{event.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">
                Tracking updates will appear once shipped.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
