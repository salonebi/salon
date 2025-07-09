// src/lib/firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; // Added GoogleAuthProvider, signInWithPopup
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQNacj_l82Dm-cOqsob5Odj9U8hGipHv8",
  authDomain: "salon-7525d.firebaseapp.com",
  projectId: "salon-7525d",
  storageBucket: "salon-7525d.firebasestorage.app",
  messagingSenderId: "1095273299179",
  appId: "1:1095273299179:web:fef9aa21f78c2225fb12ae",
  measurementId: "G-QR7QZ6F4DV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Export the GoogleAuthProvider for use in your components
const googleProvider = new GoogleAuthProvider();

// Export the initialized services and the Google provider
export { app, auth, db, googleProvider, signInWithPopup }; // Export signInWithPopup and googleProvider
