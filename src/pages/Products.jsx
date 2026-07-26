import { useEffect, useState } from "react";
import { getAllProducts } from "../services/products";
import ProductCard from "../components/ProductCard";
import "../styles/products.css";
import { auth } from "../firebase";
import { addToCart } from "../services/cart";
import CartToast from "../components/CartToast";
import { ProductGridSkeleton } from "../components/Skeleton";

function Products() {
  const [showToast, setShowToast] = useState(false);
  const [toastKey, setToastKey] = useState(0);

  const triggerCartToast = () => {
    setToastKey((key) => key + 1);
    setShowToast(true);
  };

  const handleAddToCart = async (product) => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login to add items to cart");
      return false;
    }

    try {
      await addToCart(user.uid, product.id);
      triggerCartToast();
      return true;
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("Could not add item to cart. Please try again.");
      return false;
    }
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
    return (
      <div className="products-page">
        <ProductGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <>
      <div className="products-page">
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </div>
      <CartToast
        show={showToast}
        toastKey={toastKey}
        onClose={() => setShowToast(false)}
      />
    </>
  );
}

export default Products;
