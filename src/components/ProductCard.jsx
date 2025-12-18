import '../styles/product-card.css'

function ProductCard({ product, onAddToCart }) {
  return (
    <div className="product-card">
      <div className="product-image">
        <span>🌸</span>
      </div>

      <h3>{product.name}</h3>
      <p className="price">₹{product.price}</p>

      <button onClick={() => onAddToCart(product)}>
        Add to Cart
      </button>
    </div>
  )
}

export default ProductCard
