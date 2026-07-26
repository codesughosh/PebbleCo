import '../styles/footer.css'

function Footer() {
  return (
    <footer className="footer">
  <div className="footer-links">
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
    <a href="/privacy-policy">Privacy Policy</a>
    <a href="/terms">Terms</a>
    <a href="/refund-policy">Refund Policy</a>
    <a href="/shipping-policy">Shipping Policy</a>
  </div>

  <p className="footer-text">
    © {new Date().getFullYear()} PebbleCo. All rights reserved.
  </p>
</footer>

  )
}

export default Footer
