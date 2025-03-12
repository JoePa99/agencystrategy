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
    // Check if the config has valid values
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
      console.warn(
        'Firebase config is missing or invalid. Make sure you have proper environment variables set.'
      );
      
      // Provide fallback values to prevent crashes, these won't actually work
      firebaseConfig.apiKey = 'demo-key';
      firebaseConfig.authDomain = 'demo-app.firebaseapp.com';
      firebaseConfig.projectId = 'demo-app';
      firebaseConfig.storageBucket = 'demo-app.appspot.com';
      firebaseConfig.messagingSenderId = '123456789012';
      firebaseConfig.appId = '1:123456789012:web:abcdef1234567890';
    }
    
    // Initialize Firebase
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export { app, auth, db, storage };