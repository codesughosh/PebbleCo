import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ProductCard from "./ProductCard";

function TopSellers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopSellers();
  }, []);

  const fetchTopSellers = async () => {
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
  };

  if (loading || products.length === 0) return null;

  return (
    <div className="products-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default TopSellers;
