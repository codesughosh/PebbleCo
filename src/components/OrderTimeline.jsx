const steps = [
  { key: "placed", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderTimeline({ currentStatus }) {
  const currentIndex = steps.findIndex(
    (s) => s.key === currentStatus
  );

  return (
    <div className="order-timeline">
      {steps.map((step, index) => {
        const active = index <= currentIndex;

        return (
          <div
            key={step.key}
            className={`timeline-step ${active ? "active" : ""}`}
          >
            <div className="dot" />
            <span>{step.label}</span>

            {index < steps.length - 1 && (
              <div className="line" />
            )}
          </div>
        );
      })}
    </div>
  );
}
