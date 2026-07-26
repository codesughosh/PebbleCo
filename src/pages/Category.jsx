import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CartToast from "../components/CartToast";
import ProductCard from "../components/ProductCard";
import { supabase } from "../supabaseClient";
import { auth } from "../firebase";
import { addToCart } from "../services/cart";
import { ProductGridSkeleton } from "../components/Skeleton";
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
  const [showToast, setShowToast] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const title = slug?.replaceAll("-", " ") || "Products";

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

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
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

    fetchCategoryProducts();
  }, [slug]);

  if (loading) {
    return (
      <div className="products-page">
        <h1 className="page-title">{title}</h1>
        <ProductGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <>
      <div className="products-page">
        <h1 className="page-title">{title}</h1>

        {products.length === 0 ? (
          <p className="products-empty">No products found.</p>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
      <CartToast
        show={showToast}
        toastKey={toastKey}
        onClose={() => setShowToast(false)}
      />
    </>
  );
}

export default Category;
