import "../styles/product-card.css";
import { useNavigate } from "react-router-dom";


function ProductCard({ product, addToCart }) {
  const navigate = useNavigate();
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />

      <h3>{product.name}</h3>
      <p>₹{product.price}</p>

      <button
  onClick={() => {
    addToCart(product);
    navigate("/cart");
  }}
>
  Add to Cart
</button>

    </div>
  );
}

export default ProductCard;