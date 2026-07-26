import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound, UserPlus } from "lucide-react";
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await updateProfile(userCredential.user, {
        displayName: name,
      });

      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignup = async () => {
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

          <button type="submit" className="primary-btn">
            <UserPlus size={16} strokeWidth={2} />
            Sign up
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button type="button" className="google-btn" onClick={handleGoogleSignup}>
          Continue with Google
        </button>

        <p className="switch-auth">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
