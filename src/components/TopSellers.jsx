import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ProductCard from "./ProductCard";
import { auth } from "../firebase";
import { addToCart } from "../services/cart";
import CartToast from "../components/CartToast";
import { ProductGridSkeleton } from "../components/Skeleton";

function TopSellers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const fetchTopSellers = useCallback(async () => {
    // 🔹 Check if any product is sold yet
    const { count } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true });

    // 🔹 CASE 1: Real top sellers
    if (count > 0) {
      const { data, error } = await supabase
        .from("top_selling_products")
        .select(
          `
          total_sold,
          products (*)
        `
        )
        .order("total_sold", { ascending: false })
        .limit(3);

      if (!error && data) {
        setProducts(data.map((item) => item.products));
      }
    }

    // 🔹 CASE 2: Fallback (nothing sold yet)
    else {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

      if (!error && data) {
        setProducts(data);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchTopSellers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchTopSellers]);

  if (loading) {
    return <ProductGridSkeleton count={3} className="product-grid" />;
  }

  if (products.length === 0) return null;

  return (
    <>
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
    
    <CartToast
      show={showToast}
      toastKey={toastKey}
      onClose={() => setShowToast(false)}
    />
      </>
  );
}

export default TopSellers;
