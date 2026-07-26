import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { auth } from "../firebase";
import { addToCart } from "../services/cart";
import { ProductGridSkeleton } from "../components/Skeleton";
import { supabase } from "../supabaseClient";
import "../styles/products.css";

function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleAddToCart = async (product) => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login to add items to cart");
      return false;
    }

    try {
      await addToCart(user.uid, product.id);
      return true;
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("Could not add item to cart. Please try again.");
      return false;
    }
  };

  useEffect(() => {
    const fetchNewArrivals = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error) {
        setProducts(data);
      } else {
        console.error(error);
      }

      setLoading(false);
    };

    fetchNewArrivals();
  }, []);

  if (loading) {
    return (
      <div className="products-page">
        <h1 className="page-title">New Arrivals</h1>
        <ProductGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="products-page">
      <h1 className="page-title">New Arrivals</h1>

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
  );
}

export default NewArrivals;
