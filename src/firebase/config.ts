// src/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Get Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validate Firebase config - log detailed information about what's missing
const validateFirebaseConfig = () => {
  const missingVars = [];
  
  if (!firebaseConfig.apiKey) missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket) missingVars.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!firebaseConfig.messagingSenderId) missingVars.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!firebaseConfig.appId) missingVars.push('NEXT_PUBLIC_FIREBASE_APP_ID');
  
  if (missingVars.length > 0) {
    console.error('Firebase initialization error: Missing environment variables:', missingVars);
    console.error('Current config:', JSON.stringify(firebaseConfig));
    
    // Fall back to a known working configuration for development ONLY
    if (process.env.NODE_ENV === 'development') {
      console.warn('Falling back to development Firebase config');
      return {
        apiKey: "AIzaSyA0trAXY9TnPYkkDtZ2tK0DAYYWeZf2kPI",
        authDomain: "agencystrategy-95d3d.firebaseapp.com",
        projectId: "agencystrategy-95d3d",
        storageBucket: "agencystrategy-95d3d.appspot.com",
        messagingSenderId: "1090868022098",
        appId: "1:1090868022098:web:2dc833c626358be49e088b"
      };
    }
  }
  
  return firebaseConfig;
};

// Get validated config
const validatedConfig = validateFirebaseConfig();

// Initialize Firebase only once
let app;
try {
  if (!getApps().length) {
    app = initializeApp(validatedConfig);
    console.log('Firebase initialized successfully with config:', Object.keys(validatedConfig));
  } else {
    app = getApp();
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };