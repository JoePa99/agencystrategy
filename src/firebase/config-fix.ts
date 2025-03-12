// src/firebase/config-fix.ts - Direct Firebase configuration for Vercel
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Hardcoded Firebase configuration for Vercel deployment
// This approach is used when environment variables are not working
const firebaseConfig = {
  apiKey: "AIzaSyA0trAXY9TnPYkkDtZ2tK0DAYYWeZf2kPI",
  authDomain: "agencystrategy-95d3d.firebaseapp.com",
  projectId: "agencystrategy-95d3d",
  storageBucket: "agencystrategy-95d3d.appspot.com",
  messagingSenderId: "1090868022098",
  appId: "1:1090868022098:web:2dc833c626358be49e088b"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully with direct config');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };

// Export the configuration for direct use
export { firebaseConfig };