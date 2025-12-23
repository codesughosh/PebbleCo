import "../styles/header.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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

        <div className="logo">PebbleCo</div>

        <div className="header-icons">
          <Link to="/cart" className="cart-icon">
            🛒
          </Link>
          <div className="dropdown">
            <button className="icon-btn">👤</button>

            <ul className="dropdown-menu">
              {!user ? (
                <>
                  <li>
                    <Link to="/login">Login</Link>
                  </li>
                  <li>
                    <Link to="/signup">Signup</Link>
                  </li>
                  <li>Help / Contact us</li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/profile">Profile</Link>
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
            <a href="/">Home</a>
          </li>

          <li>New Arrivals</li>
          <li className="dropdown">
            <span className="dropdown-title">
              Shop By <span className="caret">⌄</span>
            </span>

            <ul className="dropdown-menu">
              <li>Bracelets</li>
              <li>Necklaces</li>
              <li>Rings</li>
              <li>Gifts</li>
            </ul>
          </li>

          <li>
            <a href="/about">About</a>
          </li>

          <li>
            <a href="/contact">Contact</a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
