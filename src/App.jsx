import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Loader from "./components/Logo";

import { Analytics } from "@vercel/analytics/react";

import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";

import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/policies/PrivacyPolicy";
import Terms from "./pages/policies/Terms";
import RefundPolicy from "./pages/policies/RefundPolicy";
import ShippingPolicy from "./pages/policies/ShippingPolicy";
import Products from "./pages/Products";
import CheckoutDelivery from "./pages/CheckoutDelivery";
import CheckoutAddress from "./pages/CheckoutAddress";
import CheckoutSummary from "./pages/CheckoutSummary";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import GlobalBackground from "./components/GlobalBackground";
import NewArrivals from "./pages/NewArrivals";
import TrackOrder from "./pages/TrackOrder";
import PaymentProcessing from "./pages/PaymentProcessing";
import PaymentFailed from "./pages/PaymentFailed";

import Product from "./pages/Product";
import Category from "./pages/Category";

import AdminOrders from "./pages/AdminOrders";
import ScrollToTop from "./components/ScrollToTop";
function App() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("pebbleco-cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  useEffect(() => {
    localStorage.setItem("pebbleco-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true); // start fade
      setTimeout(() => {
        setLoading(false); // remove loader after fade
      }, 600); // must match CSS fade duration
    }, 1200); // how long loader stays visible

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Loader loading={loading} fadeOut={fadeOut} />
      {!loading && (
        <>
          <GlobalBackground />
          <Header />
          <ScrollToTop />

          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cart" element={<Cart cartItems={cart} />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/shipping-policy" element={<ShippingPolicy />} />
              <Route path="/products" element={<Products />} />
              <Route path="/checkout/delivery" element={<CheckoutDelivery />} />
              <Route path="/checkout/address" element={<CheckoutAddress />} />
              <Route path="/checkout/summary" element={<CheckoutSummary />} />
              <Route
                path="/order-success/:orderId"
                element={<OrderSuccess />}
              />
              <Route path="/orders" element={<Orders />} />
              <Route path="/product/:id" element={<Product />} />
              <Route path="/category/:slug" element={<Category />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              <Route path="/track" element={<TrackOrder />} />
              <Route
                path="/payment/success/:orderId"
                element={<PaymentProcessing />}
              />
              <Route path="/payment/failed" element={<PaymentFailed />} />
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<Product />} />
            </Routes>
          </main>

          <Footer />
        </>
      )}
    </>
  );
}

export default App;
