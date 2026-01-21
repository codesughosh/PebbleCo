import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ChevronDown, Camera } from "lucide-react";
import CartToast from "../components/CartToast";

function Product() {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const { id } = useParams();
  const [openDesc, setOpenDesc] = useState(false);
  const [product, setProduct] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewImages, setReviewImages] = useState([]);
  const [user, setUser] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const openGallery = (images, index = 0) => {
    setGalleryImages(images);
    setActiveIndex(index);
    setFullscreenOpen(true);
  };

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files);
    const limited = files.slice(0, 3 - reviewImages.length);
    setReviewImages((prev) => [...prev, ...limited]);
  };

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (!error) {
      setReviews(data);
    }
  };

  const submitReview = async () => {
    if (!user) {
      alert("Please log in to submit a review");
      return;
    }

    if (rating === 0) {
      alert("Please select a star rating");
      return;
    }

    const token = await user.getIdToken(); // 🔑 FIREBASE TOKEN

    const formData = new FormData();
    formData.append("product_id", product.id);
    formData.append("rating", rating);
    formData.append("comment", reviewText);

    reviewImages.forEach((img) => {
      formData.append("images", img);
    });

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reviews`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      alert("Failed to submit review");
      return;
    }

    setRating(0);
    setReviewText("");
    setReviewImages([]);
    fetchReviews();
  };

  const deleteReview = async (reviewId) => {
    const confirmDelete = window.confirm("Delete this review?");
    if (!confirmDelete) return;

    const token = await user.getIdToken(); // 🔑 FIREBASE TOKEN

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/reviews/${reviewId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`, // 🔑 REQUIRED
        },
      },
    );

    if (!res.ok) {
      alert("Failed to delete review");
      return;
    }

    fetchReviews();
  };

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setProduct(data);
      setActiveIndex(0);
      fetchReviews();
    }

    setLoading(false);
  };

  const addToCart = async () => {
    if (!user) {
      alert("Please login to add items to cart");
      return;
    }

    const token = await user.getIdToken();

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: product.id,
        quantity,
      }),
    });

    if (!res.ok) {
      alert("Failed to add to cart");
      return;
    }

    setShowToast(true);
  };

  /* ----------- SLIDER HANDLERS (MOBILE) ----------- */

  const onTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const onTouchEnd = (e) => {
    if (!touchStartX) return;

    const diff = touchStartX - e.changedTouches[0].clientX;

    if (diff > 50 && activeIndex < galleryImages.length - 1) {
      setActiveIndex(activeIndex + 1);
    }

    if (diff < -50 && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }

    setTouchStartX(null);
  };

  if (loading) return <p style={{ padding: 40 }}>Loading...</p>;
  if (!product) return <p style={{ padding: 40 }}>Product not found</p>;

  return (
    <>
      <div style={page}>
        <div style={topSection}>
          {/* IMAGE SECTION */}
          <div>
            <div
              style={sliderContainer}
              onTouchStart={isMobile ? onTouchStart : null}
              onTouchEnd={isMobile ? onTouchEnd : null}
            >
              <div
                style={{
                  ...sliderTrack,
                  transform: `translateX(-${activeIndex * 100}%)`,
                }}
              >
                {product.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    style={slideImage}
                    onClick={() => openGallery(product.images, i)}
                    onMouseEnter={(e) =>
                      (e.target.style.transform = "scale(1.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.transform = "scale(1)")
                    }
                  />
                ))}
              </div>
            </div>

            {/* DOTS (MOBILE ONLY) */}
            {isMobile && (
              <div style={dots}>
                {product.images.map((_, i) => (
                  <span
                    key={i}
                    style={{
                      ...dot,
                      opacity: i === activeIndex ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>
            )}

            {/* THUMBNAILS (DESKTOP) */}
            {!isMobile && (
              <div style={thumbRow}>
                {product.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    onClick={() => setActiveIndex(i)}
                    style={{
                      ...thumb,
                      border:
                        i === activeIndex
                          ? "2px solid #c48a9a"
                          : "1px solid #ddd",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div style={info}>
            <h1>{product.name}</h1>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {product.original_price && (
                <span
                  style={{
                    textDecoration: "line-through",
                    color: "#9a6b75",
                    fontSize: "20px",
                  }}
                >
                  ₹{product.original_price}
                </span>
              )}

              <span style={{ fontSize: "25px", fontWeight: 600 }}>
                ₹{product.price}
              </span>

              {product.original_price && (
                <span
                  style={{
                    color: "#d32f2f",
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  (
                  {Math.round(
                    ((product.original_price - product.price) /
                      product.original_price) *
                      100,
                  )}
                  % OFF)
                </span>
              )}
            </div>

            <div style={qtyWrap}>
              <button
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                style={qtyBtn}
              >
                −
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} style={qtyBtn}>
                +
              </button>
            </div>

            <button onClick={addToCart} style={addBtn}>
              Add to Cart
            </button>

            <p style={shortDesc}>{product.description}</p>
          </div>
        </div>

        {/* DESCRIPTION */}
        <section style={section}>
          <div
            onClick={() => setOpenDesc(!openDesc)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              borderBottom: "1px solid #ddd",
              paddingBottom: "12px",
            }}
          >
            <h3 style={{ margin: 0 }}>Product Description</h3>

            <ChevronDown
              size={22}
              style={{
                transform: openDesc ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
              }}
            />
          </div>

          {/* 👇 ALWAYS RENDERED */}
          <div className={`desc-wrapper ${openDesc ? "open" : ""}`}>
            <p className="desc-text">{product.long_description}</p>
          </div>
        </section>

        {/* REVIEWS */}
        <section style={section}>
          <h2>Customer Reviews</h2>

          {/* REVIEW FORM */}
          <div style={{ marginTop: "24px" }}>
            <h3>Add a Review</h3>

            {/* STARS */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    fontSize: "22px",
                    cursor: "pointer",
                    color: (hoverRating || rating) >= star ? "#f5a623" : "#ccc",
                  }}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </span>
              ))}
            </div>

            {/* TEXT BOX */}
            <textarea
              placeholder="Write your review..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                resize: "vertical",
              }}
            />
            <div style={reviewActions}>
              <label style={photoBtn}>
                <Camera size={22} />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagePick}
                  hidden
                />
              </label>

              <button onClick={submitReview} style={submitBtn}>
                Submit Review
              </button>
            </div>

            {/* PREVIEW */}
            <div style={previewRow}>
              {reviewImages.map((img, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(img)}
                  alt=""
                  style={previewThumb}
                />
              ))}
            </div>
          </div>
          {reviews.length === 0 && (
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                marginTop: "18px",
              }}
            >
              <p>--- No reviews yet. Be the first! ---</p>
            </div>
          )}

          {reviews.map((r) => (
            <div
              key={r.id}
              style={{
                marginTop: "16px",
                paddingBottom: "12px",
                borderBottom: "1px solid #eee",
                position: "relative",
              }}
            >
              {/* DELETE BUTTON (only for owner) */}
              {user && r.user_email === user.email && (
                <button
                  onClick={() => deleteReview(r.id)}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    background: "none",
                    border: "none",
                    color: "#c44",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Delete
                </button>
              )}

              <div style={reviewHeader}>
                <div style={reviewUserRow}>
                  <span style={avatarCircle}>
                    {r.username?.charAt(0).toUpperCase()}
                  </span>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <strong>{r.username}</strong>

                    <div
                      style={{
                        color: "#3b2b2f",
                        fontSize: "20px",
                        letterSpacing: "2px",
                        marginTop: "4px",
                      }}
                    >
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </div>
                  </div>
                </div>
              </div>

              <p style={{ marginTop: "6px" }}>{r.comment}</p>
              {r.image_urls && r.image_urls.length > 0 && (
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    marginTop: "8px",
                  }}
                  onClick={() => openGallery(r.image_urls, 0)}
                >
                  <img
                    src={r.image_urls[0]}
                    alt="Review"
                    style={{
                      width: "120px",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  />

                  {r.image_urls.length > 1 && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "6px",
                        right: "6px",
                        background: "rgba(0,0,0,0.7)",
                        color: "#fff",
                        fontSize: "12px",
                        padding: "2px 6px",
                        borderRadius: "10px",
                      }}
                    >
                      +{r.image_urls.length - 1}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      </div>

      {/* STICKY ADD TO CART (MOBILE) */}
      {isMobile && (
        <div style={stickyBar}>
          <strong>₹{product.price * quantity}</strong>
          <button onClick={addToCart} style={stickyBtn}>
            Add to Cart
          </button>
        </div>
      )}

      <CartToast show={showToast} onClose={() => setShowToast(false)} />

      {fullscreenOpen && (
        <div style={blurOverlay} onClick={() => setFullscreenOpen(false)}>
          <button style={closeBtn}>✕</button>

          <div
            style={singleViewer}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={galleryImages[activeIndex]}
              alt=""
              style={fullscreenImg}
            />
            <span
              style={{
                position: "absolute",
                bottom: "20px",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                padding: "4px 10px",
                borderRadius: "14px",
                fontSize: "13px",
              }}
            >
              {activeIndex + 1} / {galleryImages.length}
            </span>

            {/* LEFT */}
            {activeIndex > 0 && (
              <button
                style={navBtnLeft}
                onClick={() => setActiveIndex(activeIndex - 1)}
              >
                ‹
              </button>
            )}

            {/* RIGHT */}
            {activeIndex < galleryImages.length - 1 && (
              <button
                style={navBtnRight}
                onClick={() => setActiveIndex(activeIndex + 1)}
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- STYLES ---------------- */

const page = {
  padding: "24px",
  paddingBottom: "90px",
  maxWidth: "1100px",
  margin: "0 auto",
};

const topSection = {
  display: "flex",
  gap: "48px",
  flexWrap: "wrap",
};

const mainImage = {
  width: "100%",
  maxWidth: "380px",
  borderRadius: "16px",
};

const thumbRow = {
  display: "flex",
  gap: "10px",
  marginTop: "12px",
};

const thumb = {
  width: "60px",
  height: "60px",
  objectFit: "cover",
  borderRadius: "8px",
  cursor: "pointer",
};

const dots = {
  display: "flex",
  justifyContent: "center",
  marginTop: "10px",
};

const dot = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "#c48a9a",
  margin: "0 4px",
};

const info = {
  maxWidth: "420px",
};

const price = {
  fontSize: "20px",
  fontWeight: "600",
};

const qtyWrap = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  margin: "16px 0",
};

const qtyBtn = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  border: "1px solid #ddd",
  background: "#fff",
  fontSize: "18px",
};

const addBtn = {
  width: "100%",
  padding: "14px",
  background: "#c48a9a",
  color: "#fff",
  border: "none",
  borderRadius: "30px",
  fontSize: "16px",
};

const shortDesc = {
  marginTop: "16px",
  lineHeight: "1.6",
};

const section = {
  marginTop: "48px",
};

const sectionText = {
  lineHeight: "1.7",
};

const reviewCard = {
  background: "#fff",
  padding: "16px",
  borderRadius: "12px",
};

const reviewUser = {
  fontSize: "14px",
  opacity: 0.6,
};

const stickyBar = {
  position: "fixed",
  bottom: 0,
  left: 0,
  width: "100%",
  background: "#fff",
  borderTop: "1px solid #eee",
  padding: "12px 16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  zIndex: 1000,
};

const stickyBtn = {
  background: "#c48a9a",
  color: "#fff",
  border: "none",
  borderRadius: "24px",
  padding: "12px 20px",
};

const sliderContainer = {
  width: "100%",
  maxWidth: "380px",
  overflow: "hidden",
  borderRadius: "16px",
};

const sliderTrack = {
  display: "flex",
  transition: "transform 0.35s ease",
};

const slideImage = {
  width: "100%",
  flexShrink: 0,
  objectFit: "cover",
  transition: "transform 0.3s ease",
  cursor: "zoom-in",
};

const fullscreenOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.95)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const fullscreenImg = {
  maxWidth: "90%",
  maxHeight: "90%",
  objectFit: "contain",
  borderRadius: "12px",
  transition: "opacity 0.25s ease, transform 0.25s ease",
};

const closeBtn = {
  position: "fixed",
  top: "20px",
  right: "20px",
  fontSize: "26px",
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  background: "rgba(0,0,0,0.6)",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  transition: "transform 0.15s ease",
};

const navBtnLeft = {
  position: "fixed",
  left: "20px",
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: "34px",
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  background: "rgba(0,0,0,0.6)",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  zIndex: 10000,
  transition: "transform 0.15s ease",
};

const navBtnRight = {
  position: "fixed",
  right: "20px",
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: "34px",
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  background: "rgba(0,0,0,0.6)",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  zIndex: 10000,
  transition: "transform 0.15s ease",
};

const reviewHeader = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const reviewUserRow = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const avatarCircle = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  background: "#c48a9a",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
};

const reviewMeta = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
};

const reviewDate = {
  fontSize: "13px",
  opacity: 0.6,
};

const reviewActions = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: "12px",
};

const photoBtn = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  border: "1px solid #ddd",
  cursor: "pointer",
  background: "#fff",
};

const submitBtn = {
  padding: "10px 18px",
  borderRadius: "20px",
  border: "none",
  background: "#c48a9a",
  color: "#fff",
  cursor: "pointer",
};

const previewRow = {
  display: "flex",
  gap: "10px",
  marginTop: "10px",
};

const previewThumb = {
  width: "60px",
  height: "60px",
  objectFit: "cover",
  borderRadius: "8px",
};

const blurOverlay = {
  position: "fixed",
  inset: 0,
  backdropFilter: "blur(12px)",
  background: "rgba(255,255,255,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const galleryTrack = {
  width: "100%",
  maxWidth: "90vw",
  overflow: "hidden",
};

const singleViewer = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  maxWidth: "90vw",
  height: "100%",
};

export default Product;
