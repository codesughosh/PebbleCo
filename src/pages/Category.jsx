import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

const slugToCategory = {
  "flower-bracelet": "flower_bracelet",
  "bead-bracelet": "bead_bracelet",
  charms: "charms",
  necklace: "necklace",
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
      <h1 style={title}>{slug.replace("-", " ")}</h1>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="product-card"
            >
              {/* Discount badge – unchanged */}
              {product.original_price &&
                product.original_price > product.price && (
                  <span
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "#ffe6e6",
                      color: "#d32f2f",
                      fontSize: "14px",
                      fontWeight: 700,
                      padding: "6px 12px",
                      borderRadius: "16px",
                      zIndex: 2,
                    }}
                  >
                    {Math.round(
                      ((product.original_price - product.price) /
                        product.original_price) *
                        100
                    )}
                    % OFF
                  </span>
                )}

              <img
                src={product.images?.[0]}
                alt={product.name}
                className="product-image"
              />

              <h3 style={name}>{product.name}</h3>

              {/* ✅ FIXED PRICE SECTION (CSS controls size now) */}
              <p className="price-row">
                {product.original_price && (
                  <span className="original-price">
                    ₹{product.original_price}
                  </span>
                )}

                <span className="current-price">
                  ₹{product.price}
                </span>
              </p>
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

const name = {
  fontSize: "15px",
  margin: "4px 0",
};
