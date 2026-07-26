import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Eye, EyeOff, LockKeyhole, LogIn, Mail } from "lucide-react";
import { auth } from "../firebase";
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email first");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        navigate("/profile");
      }
    });

    return () => unsub();
  }, [navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-kicker">Account</span>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Login to PebbleCo</p>

        <form className="auth-form" onSubmit={handleLogin}>
          <label className="auth-input">
            <Mail size={17} strokeWidth={1.8} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="auth-input password-field">
            <LockKeyhole size={17} strokeWidth={1.8} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="eye-btn"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </label>

          <div className="auth-row">
            <label className="remember">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>

            <button type="button" className="forgot-link" onClick={handleForgotPassword}>
              Forgot password?
            </button>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="primary-btn">
            <LogIn size={16} strokeWidth={2} />
            Login
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button type="button" className="google-btn" onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <p className="switch-auth">
          New to PebbleCo? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
