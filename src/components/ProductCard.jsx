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


      <h3>{product.name}</h3>
      <p className="price">₹{product.price}</p>

      <button onClick={() => onAddToCart(product)}>
        Add to Cart
      </button>
    </div>
  );
}

export default ProductCard;
