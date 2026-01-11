import { Loader2 } from "lucide-react";
import "./loader.css";

function Loader({ size = 28, text }) {
  return (
    <div className="pebbleco-loader">
      <Loader2 size={size} className="spin" />
      {text && <p>{text}</p>}
    </div>
  );
}

export default Loader;
