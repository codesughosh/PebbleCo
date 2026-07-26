import { useEffect, useState } from "react";
import { AlertCircle, Loader2, PackageSearch, Search, Truck } from "lucide-react";
import OrderTimeline from "../components/OrderTimeline";
import "../styles/trackOrder.css";
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

      setTracking(data);
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
      <section className="track-shell">
        <div className="track-head">
          <span className="track-kicker">Delivery</span>
          <h1>Track Your Order</h1>
          <p className="subtitle">
            Enter your Order ID to check the latest delivery status.
          </p>
        </div>

        <form
          className="track-box"
          onSubmit={(e) => {
            e.preventDefault();
            fetchTracking();
          }}
        >
          <div className="track-input-wrap">
            <PackageSearch size={18} strokeWidth={1.8} />
            <input
              type="text"
              placeholder="Order ID (example: 7c2f...)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="track-spin" />
                Checking...
              </>
            ) : (
              <>
                <Search size={16} strokeWidth={2} />
                Track Order
              </>
            )}
          </button>
        </form>

        {error && (
          <p className="error">
            <AlertCircle size={16} strokeWidth={1.9} />
            {error}
          </p>
        )}

        {tracking && (
          <div className="tracking-card">
            <div className="tracking-card-head">
              <span className="tracking-icon">
                <Truck size={21} strokeWidth={1.8} />
              </span>
              <div>
                <h3>Shipment Status</h3>
                <p>Latest update from your order.</p>
              </div>
            </div>

            <div className="tracking-info">
              {tracking.type === "inhand" ? (
                <p>
                  <strong>Status:</strong> {tracking.tracking.status}
                </p>
              ) : (
                <>
                  <p>
                    <strong>Status:</strong>{" "}
                    {tracking.tracking?.tracking_data?.shipment_status || "--"}
                  </p>
                  <p>
                    <strong>Courier:</strong>{" "}
                    {tracking.tracking?.tracking_data?.courier_name || "--"}
                  </p>
                  <p>
                    <strong>AWB:</strong>{" "}
                    {tracking.tracking?.tracking_data?.awb_code || "--"}
                  </p>
                </>
              )}
            </div>

            <OrderTimeline
              currentStatus={
                tracking.type === "inhand"
                  ? tracking.tracking.status
                  : mapStatus(tracking.tracking?.tracking_data?.shipment_status)
              }
            />

            <div className="timeline">
              {tracking.type === "shipping" &&
                (tracking.tracking?.tracking_data?.shipment_track?.length ? (
                  tracking.tracking.tracking_data.shipment_track.map((event, i) => (
                    <div key={i} className="timeline-item">
                      <span className="dot" />
                      <div>
                        <p className="event">{event.status}</p>
                        <p className="date">{event.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="muted">Tracking updates will appear once shipped.</p>
                ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
