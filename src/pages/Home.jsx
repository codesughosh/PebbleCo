import { useState } from "react";
import ProductCard from "../components/ProductCard";
import { products } from "../data/products";
import "../styles/home.css";

const slides = [
  "Handmade with love ✨",
  "Cute. Minimal. Affordable.",
  "Accessories that feel dreamy ☁️",
];

function Home() {
  const [active, setActive] = useState(0);

  return (
    <div className="home">
      <section className="hero">
        <h1>PebbleCo</h1>

        <div className="slideshow">
          <p>{slides[active]}</p>
        </div>

        <div className="dots">
          {slides.map((_, index) => (
            <span
              key={index}
              className={index === active ? "dot active" : "dot"}
              onClick={() => setActive(index)}
            />
          ))}
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
