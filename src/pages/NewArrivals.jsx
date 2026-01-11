import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ProductCard from "../components/ProductCard"; // use your existing card
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
      .limit(12); // optional

    if (!error) {
      setProducts(data);
    } else {
      console.error(error);
    }

    setLoading(false);
  };

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading new arrivals…</p>;
  }

  return (
    <div className="products-page">
      <h1>New Arrivals</h1>

      <div className="products-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default NewArrivals;
