import { useEffect, useState } from "react";
import { sendPasswordResetEmail, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, KeyRound, LogOut, Mail, UserRound } from "lucide-react";
import { auth } from "../firebase";
import { PageLoader } from "../components/Skeleton";
import "../styles/profile.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [resetState, setResetState] = useState("idle");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/login");
      } else {
        setUser(currentUser);
      }
    });

    return () => unsub();
  }, [navigate]);

  const handlePasswordReset = async () => {
    if (!user?.email || resetState !== "idle") return;

    try {
      setResetState("sending");
      await sendPasswordResetEmail(auth, user.email);
      setResetState("sent");
      window.setTimeout(() => setResetState("idle"), 3000);
    } catch (err) {
      setResetState("idle");
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    alert("Logged out");
  };

  if (!user) {
    return <PageLoader label="Loading account..." />;
  }

  return (
    <div className="profile-page">
      <section className="profile-shell">
        <div className="profile-head">
          <div className="profile-avatar">
            <UserRound size={28} strokeWidth={1.8} />
          </div>
          <span className="profile-kicker">Account</span>
          <h1 className="profile-title">Account Settings</h1>
          <p>Manage your PebbleCo login and basic profile details.</p>
        </div>

        <section className="profile-section">
          <h2>Basic Info</h2>

          <div className="profile-row">
            <span className="profile-row-label">
              <UserRound size={17} strokeWidth={1.8} />
              Name
            </span>
            <span className="profile-row-value">{user.displayName || "Not set"}</span>
          </div>

          <div className="profile-row">
            <span className="profile-row-label">
              <Mail size={17} strokeWidth={1.8} />
              Email
            </span>
            <span className="profile-row-value">{user.email}</span>
          </div>
        </section>

        <section className="profile-section">
          <h2>Account</h2>

          <button
            type="button"
            className={`profile-row clickable feedback-action is-${
              resetState === "sent"
                ? "success"
                : resetState === "sending"
                  ? "loading"
                  : "idle"
            }`}
            onClick={handlePasswordReset}
            disabled={resetState !== "idle"}
            aria-busy={resetState === "sending"}
            aria-live="polite"
          >
            <span className="profile-row-label">
              {resetState === "sending" ? (
                <span className="feedback-spinner" aria-hidden="true" />
              ) : resetState === "sent" ? (
                <Check size={17} strokeWidth={2} />
              ) : (
                <KeyRound size={17} strokeWidth={1.8} />
              )}
              {resetState === "sending"
                ? "Sending reset link"
                : resetState === "sent"
                  ? "Reset link sent"
                  : "Change Password"}
            </span>
            <ChevronRight size={18} strokeWidth={1.8} />
          </button>

          <button type="button" className="profile-row clickable logout" onClick={handleLogout}>
            <span className="profile-row-label">
              <LogOut size={17} strokeWidth={1.8} />
              Logout
            </span>
            <ChevronRight size={18} strokeWidth={1.8} />
          </button>
        </section>
      </section>
    </div>
  );
}

export default Profile;
