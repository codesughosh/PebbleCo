import { useState, useEffect, useRef } from "react";
import slide1 from "../assets/slider/slide1.jpg";
import slide2 from "../assets/slider/slide2.jpg";
import slide3 from "../assets/slider/slide3.jpg";
import "../styles/home.css";

const slides = [slide1, slide2, slide3];

export default function Hero() {
  const [active, setActive] = useState(0);
  const touchStartX = useRef(null);

  // Auto slide
  useEffect(() => {
    const timer = setInterval(
      () => setActive((p) => (p + 1) % slides.length),
      5000
    );
    return () => clearInterval(timer);
  }, []);

  // Swipe handlers
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;

    const diff = touchStartX.current - e.changedTouches[0].clientX;

    // swipe threshold
    if (diff > 50) {
      // swipe left → next
      setActive((p) => (p + 1) % slides.length);
    } else if (diff < -50) {
      // swipe right → previous
      setActive((p) =>
        p === 0 ? slides.length - 1 : p - 1
      );
    }

    touchStartX.current = null;
  };

  return (
    <section
      className="hero-slider"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="hero-track"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {slides.map((img, i) => (
          <img key={i} src={img} alt="" className="hero-image" />
        ))}
      </div>

      <div className="dots">
        {slides.map((_, i) => (
          <span
            key={i}
            className={i === active ? "dot active" : "dot"}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </section>
  );
}
