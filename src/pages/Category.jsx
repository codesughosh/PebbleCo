import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/product-card.css";
import "../styles/products.css";

const slugToCategory = {
  "flower-bracelet": "flower_bracelet",
  "bead-bracelet": "bead_bracelet",
  charms: "charms",
  necklace: "necklace",
  crochet: "crochet",
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
    return <p className="products-loading">Loading products...</p>;
  }

  return (
    <div className="products-page">
      <h1 className="page-title">{slug.replace("-", " ")}</h1>

      {products.length === 0 ? (
        <p className="products-empty">No products found.</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => {
            const discount =
              product.original_price && product.original_price > product.price
                ? Math.round(
                    ((product.original_price - product.price) /
                      product.original_price) *
                      100,
                  )
                : null;

            return (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="product-card category-product-card"
              >
                <div className="product-media">
                  <img
                    src={product.images?.[0]}
                    alt={product.name}
                    className="product-image"
                  />

                  {discount && (
                    <span className="discount-badge">{discount}% OFF</span>
                  )}
                </div>

                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>

                  <p className="price-row">
                    {product.original_price && (
                      <span className="original-price">
                        {"\u20B9"}
                        {product.original_price}
                      </span>
                    )}

                    <span className="current-price">
                      {"\u20B9"}
                      {product.price}
                    </span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Category;
