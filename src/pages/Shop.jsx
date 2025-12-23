import ProductCard from '../components/ProductCard'
import { products } from '../data/products'
import '../styles/home.css'

function Shop({ onAddToCart }) {
  return (
    <div className="home">
      <section className="top-sellers">
        <h2>All Products</h2>

        <div className="product-grid">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default Shop
