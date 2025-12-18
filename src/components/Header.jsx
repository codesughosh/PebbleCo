import "../styles/header.css";

function Header({ onCartClick }) {
  return (
    <header className="header">
      {/* TOP ROW */}
      <div className="header-top">
        <div className="header-spacer" />

        <div className="logo">PebbleCo</div>

        <div className="header-icons">
          <button className="icon-btn" onClick={onCartClick}>
            🛒
          </button>
          <button className="icon-btn">👤</button>
        </div>
      </div>

      {/* NAV BAR */}
      <nav className="nav-bar">
        <ul>
          <li>Home</li>
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

          <li>About</li>
          <li>Contact</li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
