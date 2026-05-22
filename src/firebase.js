// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // ✅ Firestore
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCiHS6zMf3O7_U15a3uEw_uIYi57aSjFMA",
  authDomain: "myfrist-a77a7.firebaseapp.com",
  databaseURL: "https://myfrist-a77a7-default-rtdb.firebaseio.com",
  projectId: "myfrist-a77a7",
  storageBucket: "myfrist-a77a7.firebasestorage.app",
  messagingSenderId: "292460128047",
  appId: "1:292460128047:web:b2f13e685d022463dae3da",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app); // ✅ Firestore
export const storage = getStorage(app);