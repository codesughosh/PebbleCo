import "../styles/product-card.css";
import { useNavigate } from "react-router-dom";

function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();

  const goToProduct = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div className="product-card" onClick={goToProduct}>
      <img
        src={
          product.image_url ||
          product.images?.[0] ||
          product.image_urls?.[0] ||
          "/placeholder.png"
        }
        alt={product.name}
        className="product-image"
      />

      <h3 className="product-name">{product.name}</h3>

      <div className="price-row">
        {product.original_price && (
          <span className="original-price">₹{product.original_price}</span>
        )}
        <span className="current-price">₹{product.price}</span>
      </div>

      {product.original_price && (
        <span className="discount-badge">
          {Math.round(
            ((product.original_price - product.price) /
              product.original_price) *
              100
          )}
          % OFF
        </span>
      )}

      {/* 🔴 Stop click bubbling here */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddToCart && onAddToCart(product);
        }}
      >
        Add to Cart
      </button>
    </div>
  );
}

export default ProductCard;
