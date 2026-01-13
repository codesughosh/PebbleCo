import { useEffect, useState, useRef } from "react";
import ProductCard from "../components/ProductCard";
import { products } from "../data/products";
import WhyPebbleCo from "../components/WhyPebbleCo";
import TopSellers from "../components/TopSellers";

import "../styles/home.css";
import { useNavigate } from "react-router-dom";

import slide1 from "../assets/slider/1.jpg";
import slide2 from "../assets/slider/2.jpg";
import slide3 from "../assets/slider/3.jpg";

import PebbleBackground from "../components/PebbleBackground";

const slides = [slide1, slide2, slide3];

function Home() {
  const [index, setIndex] = useState(1); // start from first real slide
  const trackRef = useRef(null);
  const navigate = useNavigate();

  // auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // handle infinite loop jump
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleTransitionEnd = () => {
      if (index === slides.length + 1) {
        track.style.transition = "none";
        setIndex(1);
        track.style.transform = `translateX(-100%)`;
      }

      if (index === 0) {
        track.style.transition = "none";
        setIndex(slides.length);
        track.style.transform = `translateX(-${slides.length * 100}%)`;
      }
    };

    track.addEventListener("transitionend", handleTransitionEnd);
    return () =>
      track.removeEventListener("transitionend", handleTransitionEnd);
  }, [index]);

  // apply transform
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.style.transition = "transform 0.6s ease-in-out";
    track.style.transform = `translateX(-${index * 100}%)`;
  }, [index]);

  return (
    <PebbleBackground>
      <div className="home px-4 md:px-8 lg:px-12">
      
      {/* HERO SLIDER */}
      <section className="hero-slider">
        <div className="slider-viewport">
          <div className="slider-track" ref={trackRef}>
            {/* clone last */}
            <img src={slides[slides.length - 1]} className="hero-image" />

            {/* real slides */}
            {slides.map((img, i) => (
              <img key={i} src={img} className="hero-image" />
            ))}

            {/* clone first */}
            <img src={slides[0]} className="hero-image" />
          </div>
        </div>

        <div className="dots">
          {slides.map((_, i) => (
            <span
              key={i}
              className={index - 1 === i ? "dot active" : "dot"}
              onClick={() => setIndex(i + 1)}
            />
          ))}
        </div>
      </section>

      {/* TOP SELLERS */}
      <section className="top-sellers">
        <h2>Top Sellers</h2>
        <TopSellers />
      </section>

      {/* COLLECTIONS */}
      <section className="collections">
        <h2>Shop by Collection</h2>

        <div className="collection-grid">
          <div
            className="collection-card"
            onClick={() => navigate("/category/flower-bracelet")}
          >
            Flower Bracelets
          </div>

          <div
            className="collection-card"
            onClick={() => navigate("/category/charms")}
          >
            Charms
          </div>

          <div
            className="collection-card"
            onClick={() => navigate("/category/bead-bracelet")}
          >
            Bead Bracelets
          </div>

          <div
            className="collection-card"
            onClick={() => navigate("/category/necklace")}
          >
            Necklaces
          </div>
        </div>
      </section>

      {/* Hero / Slider */}
      
      <WhyPebbleCo />
    </div>
    </PebbleBackground>
  );
}

export default Home;
