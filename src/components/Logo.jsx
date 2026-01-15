import "../styles/logo-loader.css";

function Loader({ loading, fadeOut }) {
  return (
    <div className={`loader-overlay ${fadeOut ? "fade-out" : ""}`}>
      <div className="loader-content">
        <img
          src="/logo.png"
          alt="PebbleCo"
          className="loader-logo"
        />
      </div>
    </div>
  );
}

export default Loader;