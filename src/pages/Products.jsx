import { useEffect, useState } from "react";
import { getAllProducts } from "../services/products";
import ProductCard from "../components/ProductCard";
import "../styles/products.css";
import { auth } from "../firebase";
import { addToCart } from "../services/cart";
import CartToast from "../components/CartToast";

function Products() {
  
  const [showToast, setShowToast] = useState(false);
  
  const handleAddToCart = async (product) => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login to add items to cart");
      return;
    }

    await addToCart(user.uid, product.id);
    setShowToast(true);
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
    <>
      <div className="products-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
      <CartToast show={showToast} onClose={() => setShowToast(false)} />
    </>
  );
}

export default Products;
