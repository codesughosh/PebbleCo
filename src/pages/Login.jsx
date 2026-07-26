import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Check, Eye, EyeOff, LockKeyhole, LogIn, Mail } from "lucide-react";
import { auth } from "../firebase";
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailAuthState, setEmailAuthState] = useState("idle");
  const [googleAuthState, setGoogleAuthState] = useState("idle");
  const [resetState, setResetState] = useState("idle");
  const authBusy = emailAuthState !== "idle" || googleAuthState !== "idle";

  const handleLogin = async (e) => {
    e.preventDefault();
    if (authBusy) return;

    setError("");
    setEmailAuthState("loading");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmailAuthState("success");
      window.setTimeout(() => navigate("/"), 520);
    } catch (err) {
      setError(err.message);
      setEmailAuthState("idle");
    }
  };

  const handleForgotPassword = async () => {
    if (resetState !== "idle") return;

    if (!email) {
      setError("Please enter your email first");
      return;
    }

    try {
      setResetState("loading");
      await sendPasswordResetEmail(auth, email);
      setResetState("success");
      window.setTimeout(() => setResetState("idle"), 1800);
    } catch (err) {
      setError(err.message);
      setResetState("idle");
    }
  };

  const handleGoogleLogin = async () => {
    if (authBusy) return;

    try {
      setGoogleAuthState("loading");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setGoogleAuthState("success");
      window.setTimeout(() => navigate("/"), 520);
    } catch (err) {
      setError(err.message);
      setGoogleAuthState("idle");
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !authBusy) {
        navigate("/profile");
      }
    });

    return () => unsub();
  }, [authBusy, navigate]);

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

            <button
              type="button"
              className={`forgot-link feedback-action is-${
                resetState === "success" ? "success" : resetState
              }`}
              onClick={handleForgotPassword}
              disabled={resetState !== "idle"}
              aria-busy={resetState === "loading"}
            >
              {resetState === "loading"
                ? "Sending..."
                : resetState === "success"
                  ? "Sent!"
                  : "Forgot password?"}
            </button>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className={`primary-btn feedback-action is-${
              emailAuthState === "success" ? "success" : emailAuthState
            }`}
            disabled={authBusy}
            aria-busy={emailAuthState === "loading"}
            aria-live="polite"
          >
            {emailAuthState === "loading" ? (
              <>
                <span className="feedback-spinner" aria-hidden="true" />
                Logging in
              </>
            ) : emailAuthState === "success" ? (
              <>
                <Check size={16} strokeWidth={2.2} />
                Logged in!
              </>
            ) : (
              <>
                <LogIn size={16} strokeWidth={2} />
                Login
              </>
            )}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className={`google-btn feedback-action is-${
            googleAuthState === "success" ? "success" : googleAuthState
          }`}
          onClick={handleGoogleLogin}
          disabled={authBusy}
          aria-busy={googleAuthState === "loading"}
          aria-live="polite"
        >
          {googleAuthState === "loading" ? (
            <>
              <span className="feedback-spinner" aria-hidden="true" />
              Connecting
            </>
          ) : googleAuthState === "success" ? (
            <>
              <Check size={16} strokeWidth={2.2} />
              Connected!
            </>
          ) : (
            "Continue with Google"
          )}
        </button>

        <p className="switch-auth">
          New to PebbleCo? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
