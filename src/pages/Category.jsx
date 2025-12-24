import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

const slugToCategory = {
  "flower-bracelet": "flower_bracelet",
  "bead-bracelet": "bead_bracelet",
  "phone-charms": "phone_charms",
  "necklace": "necklace",
};

function Category() {
  const { slug } = useParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryProducts();
  }, [slug]);

  const fetchCategoryProducts = async () => {
    const category = slugToCategory[slug];

    if (!category) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", category);

    if (!error) {
      setProducts(data);
    }

    setLoading(false);
  };

  if (loading) {
    return <p style={{ padding: 40 }}>Loading products...</p>;
  }

  return (
    <div style={page}>
      <h1 style={title}>
        {slug.replace("-", " ")}
      </h1>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div style={grid}>
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              style={card}
            >
              <img
                src={product.images?.[0]}
                alt={product.name}
                style={image}
              />

              <h3 style={name}>{product.name}</h3>
              <p style={price}>₹{product.price}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Category;

/* ---------------- STYLES ---------------- */

const page = {
  padding: "32px",
  maxWidth: "1100px",
  margin: "0 auto",
};

const title = {
  textTransform: "capitalize",
  marginBottom: "24px",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "20px",
};

const card = {
  textDecoration: "none",
  color: "inherit",
};

const image = {
  width: "100%",
  aspectRatio: "1 / 1",
  objectFit: "cover",
  borderRadius: "14px",
  marginBottom: "8px",
};

const name = {
  fontSize: "15px",
  margin: "4px 0",
};

const price = {
  fontWeight: "600",
};

