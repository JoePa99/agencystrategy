// pages/test-firebase.tsx
import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export default function TestFirebase() {
  const [result, setResult] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testFirebase() {
      try {
        // Direct initialization of Firebase with hardcoded values
        const firebaseConfig = {
          apiKey: "AIzaSyA0trAXY9TnPYkkDtZ2tK0DAYYWeZf2kPI",
          authDomain: "agencystrategy-95d3d.firebaseapp.com",
          projectId: "agencystrategy-95d3d",
          storageBucket: "agencystrategy-95d3d.appspot.com",
          messagingSenderId: "1090868022098",
          appId: "1:1090868022098:web:2dc833c626358be49e088b"
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig, 'testApp');
        setResult('Firebase app initialized successfully');

        // Initialize Auth
        const auth = getAuth(app);
        setResult(prevResult => prevResult + '\nAuth initialized successfully');

        // Test auth with a dummy sign in (this will fail but will verify the API connection)
        try {
          await signInWithEmailAndPassword(auth, 'test@example.com', 'password');
        } catch (authError: any) {
          // If we get auth/user-not-found or auth/wrong-password, that's good!
          // It means the Firebase API key is valid
          if (authError.code === 'auth/user-not-found' || 
              authError.code === 'auth/wrong-password' ||
              authError.code === 'auth/invalid-credential') {
            setResult(prevResult => 
              prevResult + `\nAuthentication API test passed with expected error: ${authError.code}. This means your Firebase configuration is working!`
            );
          } else {
            // Other errors indicate configuration issues
            throw authError;
          }
        }
      } catch (error: any) {
        console.error('Firebase test error:', error);
        setError(`Error: ${error.message}${error.code ? ` (${error.code})` : ''}`);
      }
    }

    testFirebase();
  }, []);

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-4">Firebase Configuration Test</h1>
      
      {error ? (
        <div className="bg-red-50 p-4 rounded-md mb-4">
          <p className="text-red-800 font-medium mb-2">Error:</p>
          <pre className="whitespace-pre-wrap text-red-600">{error}</pre>
        </div>
      ) : (
        <div className="bg-green-50 p-4 rounded-md mb-4">
          <p className="text-green-800 font-medium mb-2">Result:</p>
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">How to use this test</h2>
        <p className="mb-4">
          This page tests if your Firebase configuration is working correctly. It tries to:
        </p>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li>Initialize Firebase with hardcoded values</li>
          <li>Initialize Firebase Authentication</li>
          <li>Test the authentication API with a dummy sign-in attempt</li>
        </ol>
        <p>
          If the test passes, your Firebase API key and configuration are valid. If it fails, 
          there might be an issue with your Firebase project configuration.
        </p>
      </div>
    </div>
  );
}