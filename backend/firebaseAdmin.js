import admin from "firebase-admin";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccount) {
  console.error("FIREBASE_SERVICE_ACCOUNT is not set");
} else {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });
      console.log("Firebase Admin initialized");
    } catch (err) {
      console.error("Firebase Admin init failed:", err.message);
    }
  }
}

export default admin;
