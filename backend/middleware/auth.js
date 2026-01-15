import admin from "../firebaseAdmin.js";

export const verifyFirebaseUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedUser = await admin.auth().verifyIdToken(token);
    req.user = decodedUser; // 🔥 THIS IS THE KEY
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid auth token" });
  }
};
