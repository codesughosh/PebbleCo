import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import {
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  UserPlus,
} from "lucide-react";
import { auth } from "../firebase";
import "../styles/auth.css";

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [emailSignupState, setEmailSignupState] = useState("idle");
  const [googleSignupState, setGoogleSignupState] = useState("idle");
  const authBusy = emailSignupState !== "idle" || googleSignupState !== "idle";

  const handleSignup = async (e) => {
    e.preventDefault();
    if (authBusy) return;

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setEmailSignupState("loading");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await updateProfile(userCredential.user, {
        displayName: name,
      });

      setEmailSignupState("success");
      window.setTimeout(() => navigate("/"), 520);
    } catch (err) {
      setError(err.message);
      setEmailSignupState("idle");
    }
  };

  const handleGoogleSignup = async () => {
    if (authBusy) return;

    try {
      setGoogleSignupState("loading");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setGoogleSignupState("success");
      window.setTimeout(() => navigate("/"), 520);
    } catch (err) {
      setError(err.message);
      setGoogleSignupState("idle");
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
        <span className="auth-kicker">Join</span>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join PebbleCo</p>

        <form className="auth-form" onSubmit={handleSignup}>
          <label className="auth-input">
            <UserRound size={17} strokeWidth={1.8} />
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

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

          <label className="auth-input password-field">
            <LockKeyhole size={17} strokeWidth={1.8} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="eye-btn"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className={`primary-btn feedback-action is-${
              emailSignupState === "success" ? "success" : emailSignupState
            }`}
            disabled={authBusy}
            aria-busy={emailSignupState === "loading"}
            aria-live="polite"
          >
            {emailSignupState === "loading" ? (
              <>
                <span className="feedback-spinner" aria-hidden="true" />
                Creating
              </>
            ) : emailSignupState === "success" ? (
              <>
                <Check size={16} strokeWidth={2.2} />
                Created!
              </>
            ) : (
              <>
                <UserPlus size={16} strokeWidth={2} />
                Sign up
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
            googleSignupState === "success" ? "success" : googleSignupState
          }`}
          onClick={handleGoogleSignup}
          disabled={authBusy}
          aria-busy={googleSignupState === "loading"}
          aria-live="polite"
        >
          {googleSignupState === "loading" ? (
            <>
              <span className="feedback-spinner" aria-hidden="true" />
              Connecting
            </>
          ) : googleSignupState === "success" ? (
            <>
              <Check size={16} strokeWidth={2.2} />
              Connected!
            </>
          ) : (
            "Continue with Google"
          )}
        </button>

        <p className="switch-auth">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
