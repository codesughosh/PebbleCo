import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ProductCard from "./ProductCard";
import { auth } from "../firebase";
import { addToCart } from "../services/cart";
import { ProductGridSkeleton } from "../components/Skeleton";

const TOP_SELLERS_LIMIT = 3;
const FEATURED_TOP_SELLERS = [
  {
    matches: (name) => name.includes("diet coke"),
  },
  {
    matches: (name) => name.includes("redbull") || name.includes("red bull"),
  },
];

function normalizeProductName(product) {
  return String(product?.name || "").toLowerCase();
}

function prioritizeFeaturedProducts(products) {
  return FEATURED_TOP_SELLERS.map((featured) =>
    products.find((product) => featured.matches(normalizeProductName(product))),
  ).filter(Boolean);
}

function mergeUniqueProducts(...productGroups) {
  const seen = new Set();

  return productGroups
    .flat()
    .filter((product) => {
      if (!product?.id || seen.has(product.id)) return false;

      seen.add(product.id);
      return true;
    })
    .slice(0, TOP_SELLERS_LIMIT);
}

function TopSellers() {
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

  const fetchTopSellers = useCallback(async () => {
    const { data: featuredData } = await supabase
      .from("products")
      .select("*")
      .or("name.ilike.%Diet Coke%,name.ilike.%Redbull%,name.ilike.%Red Bull%");
    const featuredProducts = prioritizeFeaturedProducts(featuredData || []);
    let rankedProducts = [];

    const { count } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true });

    if (count > 0) {
      const { data, error } = await supabase
        .from("top_selling_products")
        .select(
          `
          total_sold,
          products (*)
        `,
        )
        .order("total_sold", { ascending: false })
        .limit(TOP_SELLERS_LIMIT);

      if (!error && data) {
        rankedProducts = data.map((item) => item.products).filter(Boolean);
      }
    } else {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(TOP_SELLERS_LIMIT);

      if (!error && data) {
        rankedProducts = data;
      }
    }

    setProducts(mergeUniqueProducts(featuredProducts, rankedProducts));
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
    <div className="product-grid">
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

export default TopSellers;
