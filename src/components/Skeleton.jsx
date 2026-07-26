import { Loader2 } from "lucide-react";
import "../styles/skeleton.css";

function SkeletonLine({ className = "" }) {
  return <span className={`skeleton-line ${className}`} aria-hidden="true" />;
}

export function PageLoader({ label = "Loading..." }) {
  return (
    <div className="skeleton-page" role="status" aria-live="polite">
      <div className="skeleton-loader-card">
        <span className="skeleton-loader-orb">
          <Loader2 size={22} strokeWidth={1.8} />
        </span>
        <p>{label}</p>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6, className = "" }) {
  return (
    <div
      className={`skeleton-grid ${className}`.trim()}
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, index) => (
        <article className="skeleton-product-card" key={index}>
          <span className="skeleton-block skeleton-product-media" />
          <div className="skeleton-card-info">
            <SkeletonLine className="wide" />
            <SkeletonLine className="medium" />
          </div>
          <span className="skeleton-block skeleton-button" />
        </article>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="skeleton-detail-page" aria-label="Loading product">
      <section className="skeleton-detail-hero">
        <div className="skeleton-panel skeleton-gallery-panel">
          <span className="skeleton-block skeleton-gallery-image" />
          <div className="skeleton-thumb-row">
            <span className="skeleton-block skeleton-thumb" />
            <span className="skeleton-block skeleton-thumb" />
            <span className="skeleton-block skeleton-thumb" />
          </div>
        </div>

        <div className="skeleton-panel skeleton-info-panel">
          <SkeletonLine className="short" />
          <SkeletonLine className="title" />
          <SkeletonLine className="medium" />
          <div className="skeleton-price-row">
            <SkeletonLine className="price" />
            <SkeletonLine className="short" />
          </div>
          <SkeletonLine className="full" />
          <SkeletonLine className="wide" />
          <div className="skeleton-action-row">
            <span className="skeleton-block skeleton-stepper" />
            <span className="skeleton-block skeleton-cta" />
          </div>
        </div>
      </section>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="skeleton-cart-page" aria-label="Loading cart">
      <div className="skeleton-heading">
        <SkeletonLine className="pill" />
        <SkeletonLine className="title center" />
        <SkeletonLine className="medium center" />
      </div>

      <div className="skeleton-cart-layout">
        <div className="skeleton-cart-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <article className="skeleton-cart-row" key={index}>
              <span className="skeleton-block skeleton-cart-image" />
              <div className="skeleton-cart-copy">
                <SkeletonLine className="wide" />
                <SkeletonLine className="short" />
              </div>
              <span className="skeleton-block skeleton-small-pill" />
              <SkeletonLine className="price" />
            </article>
          ))}
        </div>

        <aside className="skeleton-panel skeleton-cart-summary">
          <SkeletonLine className="wide" />
          <SkeletonLine className="full" />
          <SkeletonLine className="full" />
          <SkeletonLine className="price" />
          <span className="skeleton-block skeleton-cta full-width" />
        </aside>
      </div>
    </div>
  );
}

export function CheckoutSummarySkeleton() {
  return (
    <div className="skeleton-checkout-page" aria-label="Loading checkout summary">
      <div className="skeleton-heading">
        <SkeletonLine className="pill" />
        <SkeletonLine className="title center" />
        <SkeletonLine className="wide center" />
      </div>

      <div className="skeleton-panel skeleton-checkout-panel">
        <SkeletonLine className="wide" />
        <SkeletonLine className="full" />
        <SkeletonLine className="full" />
        <SkeletonLine className="price" />
      </div>

      <div className="skeleton-panel skeleton-checkout-panel">
        <span className="skeleton-block skeleton-qr" />
        <SkeletonLine className="wide center" />
        <SkeletonLine className="full" />
        <span className="skeleton-block skeleton-cta full-width" />
      </div>
    </div>
  );
}

export function OrderListSkeleton() {
  return (
    <div className="skeleton-orders-page" aria-label="Loading orders">
      <div className="skeleton-heading">
        <SkeletonLine className="pill" />
        <SkeletonLine className="title center" />
        <SkeletonLine className="medium center" />
      </div>

      <div className="skeleton-orders-list">
        {Array.from({ length: 3 }).map((_, index) => (
          <article className="skeleton-panel skeleton-order-card" key={index}>
            <div className="skeleton-order-head">
              <span className="skeleton-block skeleton-icon" />
              <div>
                <SkeletonLine className="short" />
                <SkeletonLine className="medium" />
              </div>
            </div>
            <div className="skeleton-order-grid">
              <SkeletonLine className="full" />
              <SkeletonLine className="full" />
              <SkeletonLine className="full" />
              <SkeletonLine className="full" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function TrackingSkeleton() {
  return (
    <div className="skeleton-panel skeleton-tracking-card" aria-label="Loading tracking">
      <div className="skeleton-order-head">
        <span className="skeleton-block skeleton-icon" />
        <div>
          <SkeletonLine className="short" />
          <SkeletonLine className="wide" />
        </div>
      </div>
      <div className="skeleton-order-grid">
        <SkeletonLine className="full" />
        <SkeletonLine className="full" />
      </div>
      <SkeletonLine className="wide" />
    </div>
  );
}
