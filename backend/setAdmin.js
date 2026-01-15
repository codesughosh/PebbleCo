import admin from "firebase-admin";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// 🔹 Read service account JSON
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

// 🔹 Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 🔹 Read ADMIN UID from env
const ADMIN_UID = process.env.ADMIN_UID;

if (!ADMIN_UID) {
  console.error("❌ ADMIN_UID is missing in .env");
  process.exit(1);
}

async function setAdmin() {
  await admin.auth().setCustomUserClaims(ADMIN_UID, {
    admin: true,
  });

  console.log("✅ Admin role set successfully");
  process.exit(0);
}

setAdmin();
