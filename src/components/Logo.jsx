import "../styles/logo-loader.css";

function Loader({ loading }) {
  if (!loading) return null;

  return (
    <div className="loader-overlay">
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
