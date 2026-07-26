import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import CartToast from "../components/CartToast";
import { supabase } from "../supabaseClient";
import "../styles/product.css";

function Product() {
  const { id } = useParams();
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [openDesc, setOpenDesc] = useState(false);
  const [product, setProduct] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
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

  async function fetchReviews() {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (!error) {
      setReviews(data);
    }
  }

  async function fetchProduct() {
    setLoading(true);
    setProduct(null);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setProduct(data);
      setActiveIndex(0);
      await fetchReviews();
    }

    setLoading(false);
  }

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

  const productImages = product?.images?.length
    ? product.images
    : product?.image_urls?.length
      ? product.image_urls
      : product?.image_url
        ? [product.image_url]
        : ["/placeholder.png"];

  const discount =
    product?.original_price && product.original_price > product.price
      ? Math.round(
          ((product.original_price - product.price) / product.original_price) *
            100,
        )
      : null;

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const openGallery = (images, index = 0) => {
    setGalleryImages(images);
    setFullscreenIndex(index);
    setFullscreenOpen(true);
  };

  const handleImagePick = (event) => {
    const files = Array.from(event.target.files);
    const limited = files.slice(0, 3 - reviewImages.length);
    setReviewImages((prev) => [...prev, ...limited]);
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

    const token = await user.getIdToken();
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

    const token = await user.getIdToken();
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/reviews/${reviewId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      alert("Failed to delete review");
      return;
    }

    fetchReviews();
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

  const handleTouchStart = (event) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const handleSwipeEnd = (event, currentIndex, itemCount, setIndex) => {
    if (touchStartX === null) return;

    const diff = touchStartX - event.changedTouches[0].clientX;

    if (diff > 50 && currentIndex < itemCount - 1) {
      setIndex(currentIndex + 1);
    }

    if (diff < -50 && currentIndex > 0) {
      setIndex(currentIndex - 1);
    }

    setTouchStartX(null);
  };

  if (loading) {
    return <p className="product-state">Loading product...</p>;
  }

  if (!product) {
    return <p className="product-state">Product not found.</p>;
  }

  return (
    <>
      <div className="product-page">
        <section className="product-hero">
          <div className="product-gallery-panel">
            <div
              className="product-slider"
              onTouchStart={isMobile ? handleTouchStart : undefined}
              onTouchEnd={
                isMobile
                  ? (event) =>
                      handleSwipeEnd(
                        event,
                        activeIndex,
                        productImages.length,
                        setActiveIndex,
                      )
                  : undefined
              }
            >
              <div
                className="product-slider-track"
                style={{
                  transform: `translateX(-${activeIndex * 100}%)`,
                }}
              >
                {productImages.map((img, i) => (
                  <button
                    type="button"
                    className="product-slide"
                    key={`${img}-${i}`}
                    onClick={() => openGallery(productImages, i)}
                    aria-label={`Open product image ${i + 1}`}
                  >
                    <img src={img} alt={`${product.name} view ${i + 1}`} />
                  </button>
                ))}
              </div>
            </div>

            {isMobile ? (
              <div className="product-mobile-dots">
                {productImages.map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    className={
                      i === activeIndex
                        ? "product-mobile-dot active"
                        : "product-mobile-dot"
                    }
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Show product image ${i + 1}`}
                  />
                ))}
              </div>
            ) : (
              <div className="product-thumbs">
                {productImages.map((img, i) => (
                  <button
                    type="button"
                    key={`${img}-thumb-${i}`}
                    className={
                      i === activeIndex ? "product-thumb active" : "product-thumb"
                    }
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Select product image ${i + 1}`}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-info-panel">
            <h1>{product.name}</h1>

            <div className="product-price-row">
              {product.original_price && (
                <span className="product-original-price">
                  {"\u20B9"}
                  {product.original_price}
                </span>
              )}

              <span className="product-current-price">
                {"\u20B9"}
                {product.price}
              </span>

              {discount && (
                <span className="product-discount">{discount}% OFF</span>
              )}
            </div>

            <div className="product-quantity">
              <button
                type="button"
                onClick={() =>
                  quantity > 1 && setQuantity((current) => current - 1)
                }
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((current) => current + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="product-primary-btn"
              onClick={addToCart}
            >
              Add to Cart
            </button>

            <p className="product-short-desc">{product.description}</p>
          </div>
        </section>

        <section className="product-section">
          <button
            type="button"
            className="product-section-toggle"
            onClick={() => setOpenDesc((open) => !open)}
            aria-expanded={openDesc}
          >
            <span>Product Description</span>
            <ChevronDown
              size={22}
              className={openDesc ? "product-chevron open" : "product-chevron"}
            />
          </button>

          <div className={`product-desc-wrapper ${openDesc ? "open" : ""}`}>
            <p className="product-desc-text">{product.long_description}</p>
          </div>
        </section>

        <section className="product-section">
          <h2>Customer Reviews ({reviews.length})</h2>

          <div className="review-form">
            <h3>Add a Review</h3>

            <div className="review-stars" aria-label="Choose a rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={
                    (hoverRating || rating) >= star ? "star active" : "star"
                  }
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${star} star rating`}
                >
                  {"\u2605"}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Write your review..."
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
            />

            <div className="review-actions">
              <label className="review-photo-btn">
                <Camera size={22} />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagePick}
                  hidden
                />
              </label>

              <button
                type="button"
                className="review-submit-btn"
                onClick={submitReview}
              >
                Submit Review
              </button>
            </div>

            {reviewImages.length > 0 && (
              <div className="review-preview-row">
                {reviewImages.map((img, i) => (
                  <img
                    key={`${img.name}-${i}`}
                    src={URL.createObjectURL(img)}
                    alt={`Review upload preview ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {reviews.length === 0 && (
            <p className="empty-reviews">No reviews yet. Be the first!</p>
          )}

          <div className="review-list">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                {user && review.user_email === user.email && (
                  <button
                    type="button"
                    className="review-delete"
                    onClick={() => deleteReview(review.id)}
                  >
                    Delete
                  </button>
                )}

                <div className="review-row">
                  <span className="review-avatar">
                    {review.username?.charAt(0).toUpperCase()}
                  </span>

                  <div className="review-content">
                    <div className="review-heading">
                      <strong>{review.username}</strong>
                      {review.created_at && (
                        <span>{formatDate(review.created_at)}</span>
                      )}
                    </div>

                    <div className="review-rating">
                      {"\u2605".repeat(review.rating)}
                      {"\u2606".repeat(5 - review.rating)}
                    </div>

                    <p>{review.comment}</p>

                    {review.image_urls && review.image_urls.length > 0 && (
                      <div className="review-image-grid">
                        {review.image_urls.map((img, i) => (
                          <button
                            type="button"
                            key={`${img}-review-${i}`}
                            onClick={() => openGallery(review.image_urls, i)}
                            aria-label={`Open review image ${i + 1}`}
                          >
                            <img src={img} alt="Review" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {isMobile && (
        <div className="product-sticky-cart">
          <strong>
            {"\u20B9"}
            {product.price * quantity}
          </strong>
          <button type="button" onClick={addToCart}>
            Add to Cart
          </button>
        </div>
      )}

      <CartToast show={showToast} onClose={() => setShowToast(false)} />

      {fullscreenOpen && (
        <div
          className="product-lightbox"
          onClick={() => setFullscreenOpen(false)}
        >
          <button
            type="button"
            className="product-lightbox-close"
            onClick={() => setFullscreenOpen(false)}
            aria-label="Close image viewer"
          >
            <X size={24} />
          </button>

          <div
            className="product-lightbox-viewer"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={(event) =>
              handleSwipeEnd(
                event,
                fullscreenIndex,
                galleryImages.length,
                setFullscreenIndex,
              )
            }
          >
            <img
              src={galleryImages[fullscreenIndex]}
              alt=""
              className="product-lightbox-image"
            />

            <span className="product-lightbox-count">
              {fullscreenIndex + 1} / {galleryImages.length}
            </span>

            {fullscreenIndex > 0 && (
              <button
                type="button"
                className="product-lightbox-nav left"
                onClick={() => setFullscreenIndex((current) => current - 1)}
                aria-label="Previous image"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {fullscreenIndex < galleryImages.length - 1 && (
              <button
                type="button"
                className="product-lightbox-nav right"
                onClick={() => setFullscreenIndex((current) => current + 1)}
                aria-label="Next image"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Product;
