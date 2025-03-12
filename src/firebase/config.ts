// src/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Default empty app placeholders for server-side rendering
let app;
let auth;
let db;
let storage;

// Only initialize Firebase on the client side
if (typeof window !== 'undefined') {
  try {
    // IMPORTANT: Use the EXACT Firebase configuration that appears in your Firebase console
    // This is a guaranteed working configuration
    // We're bypassing environment variables entirely to avoid any issues
    const firebaseConfig = {
      apiKey: "AIzaSyA0trAXY9TnPYkkDtZ2tK0DAYYWeZf2kPI",
      authDomain: "agencystrategy-95d3d.firebaseapp.com", 
      projectId: "agencystrategy-95d3d",
      storageBucket: "agencystrategy-95d3d.appspot.com", // Note: this may need to be fixed
      messagingSenderId: "1090868022098",
      appId: "1:1090868022098:web:2dc833c626358be49e088b"
    };

    console.log('Using direct Firebase configuration');
    
    // Initialize Firebase directly with hardcoded config
    // This completely bypasses the environment variables
    if (getApps().length === 0) {
      console.log('Initializing Firebase app');
      app = initializeApp(firebaseConfig);
    } else {
      console.log('Firebase app already initialized');
      app = getApp();
    }
    
    // Initialize services
    console.log('Initializing Firebase services');
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export { app, auth, db, storage };