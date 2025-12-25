import { useEffect, useState } from "react";
import { getAllProducts } from "../services/products";
import ProductCard from "../components/ProductCard";
import "../styles/products.css";
import { auth } from "../firebase";
import { addToCart } from "../services/cart";
function Products() {
  const handleAddToCart = async (product) => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login to add items to cart");
      return;
    }

    await addToCart(user.uid, product.id);
    alert("Added to cart");
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const data = await getAllProducts();
      setProducts(data);
      setLoading(false);
    }

    fetchProducts();
  }, []);

  if (loading) {
    return <p>Loading products...</p>;
  }

  return (
    <div className="products-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
}

export default Products;
