import "../styles/header.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, UserRound } from "lucide-react";

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

  return (
    <header className="header">
      {/* TOP ROW */}
      <div className="header-top">
        <div className="header-spacer" />

        <Link to="/" className="logo">
  PebbleCo
</Link>


        <div className="header-icons">
          <button
            className="mobile-hamburger"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            ☰
          </button>

          <Link to="/cart" className="cart-icon">
            <ShoppingCart size={22} strokeWidth={1.8} />
          </Link>

          <div className="dropdown">
            <button className="icon-btn">
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

                  <li
                    onClick={async () => {
                      await signOut(auth);
                      navigate("/");
                    }}
                  >
                    Logout
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* NAV BAR */}
      <nav className="nav-bar">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>

          <li>
            <Link to="/new-arrivals">New Arrivals</Link>
          </li>

          <li className="dropdown">
            <span className="dropdown-title">
              Shop By <span className="caret">⌄</span>
            </span>

            <ul className="dropdown-menu">
              <li>
                <Link to="/category/flower-bracelet">Flower Bracelet</Link>
              </li>

              <li>
                <Link to="/category/bead-bracelet">Bead Bracelet</Link>
              </li>

              <li>
                <Link to="/category/charms">Charms</Link>
              </li>

              <li>
                <Link to="/category/necklace">Necklace</Link>
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
          <Link to="/" onClick={() => setMobileNavOpen(false)}>
            Home
          </Link>
          <Link to="/new" onClick={() => setMobileNavOpen(false)}>
            New Arrivals
          </Link>

          <div
            className="mobile-link"
            onClick={() => setMobileShopByOpen(!mobileShopByOpen)}
          >
            Shop By ⌄
          </div>

          {mobileShopByOpen && (
            <div className="mobile-submenu">
              <Link
                to="/category/flower-bracelet"
                onClick={() => setMobileNavOpen(false)}
              >
                Flower Bracelet
              </Link>
              <Link
                to="/category/bead-bracelet"
                onClick={() => setMobileNavOpen(false)}
              >
                Bead Bracelet
              </Link>
              <Link
                to="/category/charms"
                onClick={() => setMobileNavOpen(false)}
              >
                Charms
              </Link>
              <Link
                to="/category/necklace"
                onClick={() => setMobileNavOpen(false)}
              >
                Necklace
              </Link>
            </div>
          )}

          <Link to="/about" onClick={() => setMobileNavOpen(false)}>
            About
          </Link>
          <Link to="/contact" onClick={() => setMobileNavOpen(false)}>
            Contact
          </Link>
        </div>
      
    
    </header>
  );
}

export default Header;
