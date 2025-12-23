import { useEffect, useState } from "react";
import { sendPasswordResetEmail, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import "../styles/profile.css";
import { useNavigate } from "react-router-dom";

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
    return <p style={{ padding: "40px" }}>Loading...</p>;
  }

  return (
    <div className="profile-page">
      <h1 className="profile-title">Account Settings</h1>

      <section className="profile-section">
        <h2>Basic Info</h2>

        <div className="profile-row">
          <span>Name</span>
          <span>{user.displayName || "Not set"}</span>
        </div>

        <div className="profile-row">
          <span>Email</span>
          <span>{user.email}</span>
        </div>
      </section>

      <section className="profile-section">
        <h2>Account</h2>

        <div className="profile-row clickable" onClick={handlePasswordReset}>
          <span>Change Password</span>
          <span>›</span>
        </div>

        <div className="profile-row clickable logout" onClick={handleLogout}>
          <span>Logout</span>
          <span>›</span>
        </div>
      </section>
    </div>
  );
}

export default Profile;
