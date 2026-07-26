import "../styles/header.css";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { ChevronDown, Menu, ShoppingCart, UserRound, X } from "lucide-react";

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

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-spacer" />

        <Link to="/" className="logo" onClick={closeMobileNav}>
          PebbleCo
        </Link>

        <div className="header-icons">
          <button
            type="button"
            className="mobile-hamburger"
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? (
              <X size={22} strokeWidth={1.8} />
            ) : (
              <Menu size={22} strokeWidth={1.8} />
            )}
          </button>

          <Link to="/cart" className="cart-icon" aria-label="Cart">
            <ShoppingCart size={22} strokeWidth={1.8} />
          </Link>

          <div className="dropdown account-dropdown">
            <button type="button" className="icon-btn" aria-label="Account">
              <UserRound size={22} strokeWidth={1.8} />
            </button>

            <ul className="dropdown-menu">
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
                    <button type="button" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      <nav className="nav-bar" aria-label="Primary navigation">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/new-arrivals">New Arrivals</Link>
          </li>
          <li className="dropdown">
            <span className="dropdown-title">
              Shop By <ChevronDown size={14} strokeWidth={1.8} />
            </span>

            <ul className="dropdown-menu">
              <li>
                <Link to="/category/flower-bracelet">Flower Bracelets</Link>
              </li>
              <li>
                <Link to="/category/bead-bracelet">Bead Bracelets</Link>
              </li>
              <li>
                <Link to="/category/charms">Charms</Link>
              </li>
              <li>
                <Link to="/category/necklace">Necklaces</Link>
              </li>
              <li>
                <Link to="/category/crochet">Crochets</Link>
              </li>
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
          className="mobile-link"
          onClick={() => setMobileShopByOpen((open) => !open)}
          aria-expanded={mobileShopByOpen}
        >
          <span>Shop By</span>
          <ChevronDown
            size={16}
            strokeWidth={1.8}
            className={mobileShopByOpen ? "mobile-caret open" : "mobile-caret"}
          />
        </button>

        <div className={`mobile-submenu ${mobileShopByOpen ? "open" : ""}`}>
          <Link to="/category/flower-bracelet" onClick={closeMobileNav}>
            Flower Bracelet
          </Link>
          <Link to="/category/bead-bracelet" onClick={closeMobileNav}>
            Bead Bracelet
          </Link>
          <Link to="/category/charms" onClick={closeMobileNav}>
            Charms
          </Link>
          <Link to="/category/necklace" onClick={closeMobileNav}>
            Necklace
          </Link>
          <Link to="/category/crochet" onClick={closeMobileNav}>
            Crochets
          </Link>
        </div>

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
