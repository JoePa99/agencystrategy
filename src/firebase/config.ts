// src/firebase/config.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, Storage } from 'firebase/storage';

// IMPORTANT: Directly hardcoded Firebase configuration
// This completely bypasses environment variables to ensure consistency
const firebaseConfig = {
  apiKey: "AIzaSyA0trAXY9TnPYkkDtZ2tK0DAYYWeZf2kPI",
  authDomain: "agencystrategy-95d3d.firebaseapp.com", 
  projectId: "agencystrategy-95d3d",
  storageBucket: "agencystrategy-95d3d.appspot.com",
  messagingSenderId: "1090868022098",
  appId: "1:1090868022098:web:2dc833c626358be49e088b"
};

// Default empty app placeholders for server-side rendering
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: Storage | undefined;

// Only initialize Firebase on the client side
if (typeof window !== 'undefined') {
  try {
    console.log('Initializing Firebase with hardcoded configuration');
    
    // Initialize Firebase directly with hardcoded config
    if (getApps().length === 0) {
      console.log('Creating new Firebase app instance');
      app = initializeApp(firebaseConfig);
    } else {
      console.log('Using existing Firebase app instance');
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