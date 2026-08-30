import "../styles/header.css";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ChevronDown, Menu, ShoppingCart, UserRound } from "lucide-react";
import { auth } from "../firebase";

const categories = [
  { label: "Flower Bracelets", path: "/category/flower-bracelet" },
  { label: "Bead Bracelets", path: "/category/bead-bracelet" },
  { label: "Charms", path: "/category/charms" },
  { label: "Necklaces", path: "/category/necklace" },
  { label: "Rings", path: "/category/rings" },
  { label: "Crochets", path: "/category/crochet" },
];

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileShopByOpen, setMobileShopByOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsub();
  }, []);

  const closeMobileNav = () => {
    setMobileNavOpen(false);
    setMobileShopByOpen(false);
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-spacer" />

        <Link to="/" className="logo">
          PebbleCo
        </Link>

        <div className="header-icons">
          <button
            type="button"
            className="mobile-hamburger"
            aria-label="Open menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <Menu size={22} strokeWidth={2} />
          </button>

          <Link to="/cart" className="cart-icon" aria-label="Open cart">
            <ShoppingCart size={22} strokeWidth={1.8} />
          </Link>

          <div className="dropdown account-dropdown">
            <button type="button" className="icon-btn" aria-label="Account menu">
              <UserRound size={22} strokeWidth={1.8} />
            </button>

            <ul className="dropdown-menu account-menu">
              {!user ? (
                <>
                  <li>
                    <Link to="/login">Login</Link>
                  </li>
                  <li>
                    <Link to="/signup">Signup</Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/profile">Profile</Link>
                  </li>
                  <li>
                    <Link to="/orders">My Orders</Link>
                  </li>
                  <li>
                    <Link to="/track">Track Order</Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-action"
                      onClick={async () => {
                        await signOut(auth);
                        navigate("/");
                      }}
                    >
                      Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      <nav className="nav-bar" aria-label="Main navigation">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/new-arrivals">New Arrivals</Link>
          </li>
          <li className="dropdown shop-dropdown">
            <span className="dropdown-title">
              Shop By <ChevronDown className="caret" size={14} strokeWidth={2} />
            </span>

            <ul className="dropdown-menu category-menu">
              {categories.map((category) => (
                <li key={category.path}>
                  <Link to={category.path}>{category.label}</Link>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/contact">Contact</Link>
          </li>
        </ul>
      </nav>

      <div className={`mobile-nav ${mobileNavOpen ? "open" : ""}`}>
        <Link to="/" onClick={closeMobileNav}>
          Home
        </Link>
        <Link to="/new-arrivals" onClick={closeMobileNav}>
          New Arrivals
        </Link>

        <button
          type="button"
          className={`mobile-link ${mobileShopByOpen ? "open" : ""}`}
          aria-expanded={mobileShopByOpen}
          onClick={() => setMobileShopByOpen((open) => !open)}
        >
          Shop By <ChevronDown size={14} strokeWidth={2} />
        </button>

        {mobileShopByOpen && (
          <div className="mobile-submenu">
            {categories.map((category) => (
              <Link key={category.path} to={category.path} onClick={closeMobileNav}>
                {category.label}
              </Link>
            ))}
          </div>
        )}

        <Link to="/about" onClick={closeMobileNav}>
          About
        </Link>
        <Link to="/contact" onClick={closeMobileNav}>
          Contact
        </Link>
      </div>
    </header>
  );
}

export default Header;
