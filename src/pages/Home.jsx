import { useEffect, useRef, useState } from "react";
import WhyPebbleCo from "../components/WhyPebbleCo";
import TopSellers from "../components/TopSellers";
import "../styles/home.css";
import { useNavigate } from "react-router-dom";
import { Instagram, MessageCircle } from "lucide-react";
import slide1 from "../assets/slider/1.jpg";
import slide2 from "../assets/slider/2.jpg";
import slide3 from "../assets/slider/3.jpg";
import promoFlowerBraceletAlt from "../assets/products/fb2.jpg";
import promoStargirlNecklace from "../assets/products/stargirl3.jpg";
import PebbleBackground from "../components/PebbleBackground";

const slides = [slide1, slide2, slide3];
const instagramTiles = [
  {
    src: promoFlowerBraceletAlt,
    label: "Ocean floral bracelet",
  },
  {
    src: "/logo.png",
    label: "PebbleCo logo",
    variant: "logo",
  },
  {
    src: promoStargirlNecklace,
    label: "Stargirl necklace",
  },
];
const collections = [
  { label: "Flower Bracelets", path: "/category/flower-bracelet" },
  { label: "Charms", path: "/category/charms" },
  { label: "Bead Bracelets", path: "/category/bead-bracelet" },
  { label: "Necklaces", path: "/category/necklace" },
  { label: "Rings", path: "/category/rings" },
  { label: "Crochets", path: "/category/crochet" },
];

function Home() {
  const [index, setIndex] = useState(1);
  const trackRef = useRef(null);
  const collectionsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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
    return () => {
      track.removeEventListener("transitionend", handleTransitionEnd);
    };
  }, [index]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.style.transition = "transform 0.72s var(--ios-ease)";
    track.style.transform = `translateX(-${index * 100}%)`;
  }, [index]);

  const scrollToCollections = () => {
    collectionsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleHeroKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      scrollToCollections();
    }
  };

  return (
    <PebbleBackground>
      <div className="home">
        <section
          className="hero-slider"
          onClick={scrollToCollections}
          onKeyDown={handleHeroKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Scroll to shop by collection"
        >
          <div className="slider-viewport">
            <div className="slider-track" ref={trackRef}>
              <img
                src={slides[slides.length - 1]}
                className="hero-image"
                alt=""
                aria-hidden="true"
              />

              {slides.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="hero-image"
                  alt={`PebbleCo featured collection ${i + 1}`}
                />
              ))}

              <img
                src={slides[0]}
                className="hero-image"
                alt=""
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="dots">
            {slides.map((_, i) => (
              <button
                type="button"
                key={i}
                className={index - 1 === i ? "dot active" : "dot"}
                aria-label={`Show slide ${i + 1}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setIndex(i + 1);
                }}
              />
            ))}
          </div>
        </section>

        <section className="top-sellers">
          <h2 className="section-title">Top Sellers</h2>
          <TopSellers />
        </section>

        <section className="instagram-promo" aria-labelledby="instagram-promo-title">
          <div className="instagram-promo-copy">
            <span className="instagram-kicker">
              <Instagram size={15} strokeWidth={1.9} />
              Instagram
            </span>
            <h2 id="instagram-promo-title">@pebbleco.store</h2>
            <p>
              Follow us for New Arrivals, Custom accessories and more!
            </p>

            <div className="instagram-actions">
              <a
                className="instagram-primary tap-feedback"
                href="https://www.instagram.com/pebbleco.store"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={16} strokeWidth={2} />
                Follow on Instagram
              </a>

              <a
                className="instagram-secondary tap-feedback"
                href="https://ig.me/m/pebbleco.store"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={16} strokeWidth={2} />
                DM us
              </a>
            </div>
          </div>

          <div className="instagram-preview" aria-label="PebbleCo Instagram previews">
            {instagramTiles.map((tile) => (
              <div
                className={`instagram-tile${
                  tile.variant === "logo" ? " instagram-logo-tile" : ""
                }`}
                key={tile.label}
              >
                <img src={tile.src} alt={tile.label} />
              </div>
            ))}
          </div>
        </section>

        <section className="collections" ref={collectionsRef}>
          <h2 className="section-title">Shop by Collection</h2>

          <div className="collection-grid">
            {collections.map((collection) => (
              <button
                type="button"
                className="collection-card"
                key={collection.path}
                onClick={() => navigate(collection.path)}
              >
                <span>{collection.label}</span>
              </button>
            ))}
          </div>
        </section>

        <WhyPebbleCo />
      </div>
    </PebbleBackground>
  );
}

export default Home;
