import "../styles/product-card.css";
import { useNavigate } from "react-router-dom";

function ProductCard({ product, onAddToCart }) {
  return (
    <div className="product-card">
      <img
        src={product.image_url || "/placeholder.png"}
        alt={product.name}
        className="product-image"
      />

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

      <button onClick={() => onAddToCart(product)}>Add to Cart</button>
    </div>
  );
}

export default ProductCard;
