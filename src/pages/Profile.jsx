import { useEffect, useState } from "react";
import { sendPasswordResetEmail, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { ChevronRight, KeyRound, LogOut, Mail, UserRound } from "lucide-react";
import { auth } from "../firebase";
import "../styles/profile.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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
    if (!user?.email) return;

    try {
      await sendPasswordResetEmail(auth, user.email);
      alert("Password reset email sent (check spam too)");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    alert("Logged out");
  };

  if (!user) {
    return (
      <div className="profile-state">
        <div className="profile-state-card">Loading account...</div>
      </div>
    );
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

          <button type="button" className="profile-row clickable" onClick={handlePasswordReset}>
            <span className="profile-row-label">
              <KeyRound size={17} strokeWidth={1.8} />
              Change Password
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
