import admin from "firebase-admin";
import fs from "fs";

// 🔹 Read service account JSON manually
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

// 🔹 Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 🔹 PUT YOUR FIREBASE UID HERE
const ADMIN_UID = "rts8YoPCLbgSzksVfxKMp1brv3E2";

async function setAdmin() {
  await admin.auth().setCustomUserClaims(ADMIN_UID, {
    admin: true,
  });

  console.log("✅ Admin role set successfully");
  process.exit(0);
}

setAdmin();
