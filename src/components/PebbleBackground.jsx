export default function PebbleBackground({ children }) {
  return (
    <div className="pebble-page">
      <div className="pebble-page-bg" />
      <div className="pebble-page-content">{children}</div>
    </div>
  );
}
