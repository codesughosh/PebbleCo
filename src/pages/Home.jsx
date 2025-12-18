import { useState } from "react";
import ProductCard from "../components/ProductCard";
import { products } from "../data/products";
import "../styles/home.css";
import slide1 from "../assets/slider/slide1.jpg";
import slide2 from "../assets/slider/slide2.jpg";
import slide3 from "../assets/slider/slide3.jpg";
import { useEffect } from "react";

const slides = [slide1, slide2, slide3];

function Home() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);
  return (
    <div className="home">
      <section className="hero-slider">
        <div className="slideshow full">
          <img src={slides[active]} alt="PebbleCo slide" />

          <div className="dots">
            {slides.map((_, index) => (
              <span
                key={index}
                className={index === active ? "dot active" : "dot"}
                onClick={() => setActive(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="top-sellers">
        <h2>Top Sellers</h2>

        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          <section className="collections">
            <h2>Shop by Collection</h2>

            <div className="collection-grid">
              <div className="collection-card">Bracelets</div>
              <div className="collection-card">Necklaces</div>
              <div className="collection-card">Rings</div>
              <div className="collection-card">Gifts</div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

export default Home;
