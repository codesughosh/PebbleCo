import "../styles/WhyPebbleCo.css";

const reasons = [
  {
    title: "Handmade with care",
    desc: "Every piece is thoughtfully designed and handcrafted, never mass-produced."
  },
  {
    title: "Minimal & timeless",
    desc: "Soft colors and clean designs that feel calm, elegant, and wearable every day."
  },
  {
    title: "Student-led & affordable",
    desc: "Quality accessories at honest prices, built with passion, not profit-first."
  },
  {
    title: "Made to gift, made to keep",
    desc: "Whether it’s for yourself or someone special, it always feels personal."
  }
];

export default function WhyPebbleCo() {
  return (
    <section className="why-pebbleco">
      <h2 className="why-title">Why PebbleCo?</h2>
      <p className="why-subtitle">
        Thoughtful accessories made for everyday moments.
      </p>

      <div className="why-grid">
        {reasons.map((item, index) => (
          <div className="why-card" key={index}>
            <h4>{item.title}</h4>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
