import { Link } from "react-router-dom";
import "../styles/footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-shell">
        <Link to="/" className="footer-logo">
          PebbleCo
        </Link>

        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/refund-policy">Refund Policy</Link>
          <Link to="/shipping-policy">Shipping Policy</Link>
        </nav>

        <p className="footer-text">
          Copyright {new Date().getFullYear()} PebbleCo. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
