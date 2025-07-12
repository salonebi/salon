// src/lib/firebase.ts

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'; // Import getFunctions and connectFunctionsEmulator

// Your web app's Firebase configuration, now read from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only if it hasn't been initialized yet
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app); // Initialize functions instance

// Connect to Firebase Functions emulator if in development environment
if (process.env.NODE_ENV === 'development') {
  const functionsEmulatorHost = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST;
  const functionsEmulatorPort = process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_PORT;

  if (functionsEmulatorHost && functionsEmulatorPort) {
    console.log(`Connecting to Functions emulator at http://${functionsEmulatorHost}:${functionsEmulatorPort}`);
    connectFunctionsEmulator(functions, functionsEmulatorHost, parseInt(functionsEmulatorPort, 10));
  } else {
    console.warn("Functions emulator environment variables not fully set. Not connecting to emulator.");
  }
}


// Export the GoogleAuthProvider for use in your components
const googleProvider = new GoogleAuthProvider();

// Export the initialized services and the Google provider
export { app, auth, db, functions, googleProvider, signInWithPopup }; // Export functions as well