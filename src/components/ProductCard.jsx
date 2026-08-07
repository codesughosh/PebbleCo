import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStockValue, isNewProduct } from "../utils/productStatus";
import "../styles/product-card.css";

function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  const [cartState, setCartState] = useState("idle");
  const resetTimerRef = useRef(null);
  const stock = getStockValue(product.stock);
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock < 7;
  const showStockMessage = isOutOfStock || isLowStock;
  const showNewBadge = isNewProduct(product.created_at);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

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

  const handleAddClick = async (event) => {
    event.stopPropagation();

    if (!onAddToCart || isOutOfStock || cartState !== "idle") return;

    setCartState("loading");

    try {
      const added = await onAddToCart(product);

      if (added === false) {
        setCartState("idle");
        return;
      }

      setCartState("added");

      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }

      resetTimerRef.current = window.setTimeout(() => {
        setCartState("idle");
      }, 1300);
    } catch (error) {
      console.error("Add to cart error:", error);
      setCartState("idle");
    }
  };

  return (
    <article
      className={`product-card${isOutOfStock ? " is-out-of-stock" : ""}`}
      onClick={goToProduct}
    >
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

        {showNewBadge && <span className="product-new-badge">New</span>}
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

        {showStockMessage && (
          <p
            className={`product-card-stock ${
              isOutOfStock ? "is-empty" : "is-low"
            }`}
          >
            {isOutOfStock
              ? "Out of stock"
              : `Only ${stock} left`}
          </p>
        )}
      </div>

      {isOutOfStock ? (
        <span className="product-out-stock-pill">Out of stock</span>
      ) : (
        <button
          type="button"
          className={`product-add-btn add-cart-action is-${cartState}`}
          onClick={handleAddClick}
          disabled={!onAddToCart}
          aria-disabled={!onAddToCart || cartState !== "idle"}
          aria-busy={cartState === "loading"}
          aria-live="polite"
        >
          {cartState === "loading" && (
            <span className="add-cart-spinner" aria-hidden="true" />
          )}
          <span>
            {cartState === "added"
              ? "Added!"
              : cartState === "loading"
                ? "Adding"
                : "Add to Cart"}
          </span>
        </button>
      )}
    </article>
  );
}

export default ProductCard;
