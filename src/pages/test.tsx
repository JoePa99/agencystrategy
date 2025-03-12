// src/pages/test.tsx
import { useEffect, useState } from 'react';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { app, db } from '@/firebase/config';

export default function TestPage() {
  const [authStatus, setAuthStatus] = useState<string>('Checking auth...');
  const [firestoreStatus, setFirestoreStatus] = useState<string>('Not tested yet');
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const auth = getAuth(app);
    
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthStatus(`Authenticated as ${user.uid}`);
        setUserId(user.uid);
      } else {
        setAuthStatus('Not authenticated');
        setUserId(null);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  const handleAnonymousSignIn = async () => {
    try {
      setError(null);
      const auth = getAuth(app);
      await signInAnonymously(auth);
    } catch (err) {
      console.error('Error signing in:', err);
      setError(`Auth error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  const handleTestWrite = async () => {
    if (!userId) {
      setError('Must be authenticated to test Firestore');
      return;
    }
    
    try {
      setError(null);
      setFirestoreStatus('Testing Firestore write...');
      
      // Try to write to a test document
      await setDoc(doc(db, 'test', userId), {
        timestamp: new Date(),
        message: 'Test write successful'
      });
      
      setFirestoreStatus('Write successful! Testing read...');
      
      // Try to read the document back
      const docRef = doc(db, 'test', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setFirestoreStatus(`Read successful! Data: ${JSON.stringify(docSnap.data())}`);
      } else {
        setFirestoreStatus('Read failed: Document does not exist');
      }
    } catch (err) {
      console.error('Firestore error:', err);
      setFirestoreStatus('Failed!');
      setError(`Firestore error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleListCollections = async () => {
    try {
      setError(null);
      setFirestoreStatus('Listing collections...');
      
      // Try to list collections
      const snapshot = await getDocs(collection(db, 'test'));
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setFirestoreStatus(`Listed ${docs.length} documents in 'test' collection`);
    } catch (err) {
      console.error('Firestore error:', err);
      setFirestoreStatus('Failed to list collections!');
      setError(`Firestore error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Firebase Test Page</h1>
      
      <div className="mb-6 p-4 border rounded-md">
        <h2 className="text-lg font-semibold mb-2">Authentication</h2>
        <p className="mb-2">Status: {authStatus}</p>
        
        {!userId && (
          <button
            onClick={handleAnonymousSignIn}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Sign in anonymously
          </button>
        )}
      </div>
      
      <div className="mb-6 p-4 border rounded-md">
        <h2 className="text-lg font-semibold mb-2">Firestore</h2>
        <p className="mb-2">Status: {firestoreStatus}</p>
        
        <div className="flex space-x-2">
          <button
            onClick={handleTestWrite}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            disabled={!userId}
          >
            Test Write & Read
          </button>
          
          <button
            onClick={handleListCollections}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
            disabled={!userId}
          >
            List Collections
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 rounded-md">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-gray-100 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Debug Info</h2>
        <p className="text-sm">Firebase Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</p>
        <p className="text-sm">User ID: {userId || 'Not authenticated'}</p>
      </div>
    </div>
  );
}