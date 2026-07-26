import { useNavigate } from "react-router-dom";
import "../styles/product-card.css";

function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();

  const goToProduct = () => {
    navigate(`/product/${product.id}`);
  };

  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(
          ((product.original_price - product.price) / product.original_price) *
            100,
        )
      : null;

  return (
    <article className="product-card" onClick={goToProduct}>
      <div className="product-media">
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

        {discount && <span className="discount-badge">{discount}% OFF</span>}
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>

        <div className="price-row">
          {product.original_price && (
            <span className="original-price">
              {"\u20B9"}
              {product.original_price}
            </span>
          )}
          <span className="current-price">
            {"\u20B9"}
            {product.price}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="product-add-btn"
        onClick={(event) => {
          event.stopPropagation();
          onAddToCart && onAddToCart(product);
        }}
      >
        Add to Cart
      </button>
    </article>
  );
}

export default ProductCard;
