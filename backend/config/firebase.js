const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

let credentials;

if (process.env.FIREBASE_PRIVATE_KEY) {
  credentials = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
} else {
  credentials = require("./serviceAccountKey.json");
}

initializeApp({
  credential: cert(credentials),
});

module.exports = { getAuth };