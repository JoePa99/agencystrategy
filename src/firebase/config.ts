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
    // Add debugging for environment variables
    console.log('Firebase config in environment:', {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set (hidden)' : 'Not set',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Not set',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Set' : 'Not set',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'Set' : 'Not set',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'Set' : 'Not set',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'Set' : 'Not set',
    });

    // Hard-code the values for now as a temporary fix
    // IMPORTANT: These should match exactly what's in your Firebase console
    const hardcodedConfig = {
      apiKey: "AIzaSyA0trAXY9TnPYkkDtZ2tK0DAYYWeZf2kPI",
      authDomain: "agencystrategy-95d3d.firebaseapp.com",
      projectId: "agencystrategy-95d3d",
      storageBucket: "agencystrategy-95d3d.firebasestorage.app",
      messagingSenderId: "1090868022098",
      appId: "1:1090868022098:web:2dc833c626358be49e088b",
      measurementId: "G-ABCDEF1234"
    };
    
    // Use environment variables if available, otherwise use hardcoded values
    const finalConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || hardcodedConfig.apiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || hardcodedConfig.authDomain,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || hardcodedConfig.projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || hardcodedConfig.storageBucket,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || hardcodedConfig.messagingSenderId,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || hardcodedConfig.appId,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || hardcodedConfig.measurementId,
    };
    
    console.log('Using Firebase configuration:', {
      ...finalConfig,
      apiKey: finalConfig.apiKey ? 'Set (hidden)' : 'Not set'
    });
    
    // Initialize Firebase with the configuration
    app = getApps().length > 0 ? getApp() : initializeApp(finalConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export { app, auth, db, storage };