// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDKG_fnqCuquaLZkUB8zeWeryA9wpfqnE4",
  authDomain: "pebbleco-59d23.firebaseapp.com",
  projectId: "pebbleco-59d23",
  storageBucket: "pebbleco-59d23.firebasestorage.app",
  messagingSenderId: "931166465616",
  appId: "1:931166465616:web:ecb4d6bafe4d1af073eb55"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
