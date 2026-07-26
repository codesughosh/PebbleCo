import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { supabase } from "../supabaseClient";
import "../styles/products.css";

function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewArrivals();
  }, []);

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

  if (loading) {
    return <p className="products-loading">Loading new arrivals...</p>;
  }

  return (
    <div className="products-page">
      <h1 className="page-title">New Arrivals</h1>

      <div className="products-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default NewArrivals;
