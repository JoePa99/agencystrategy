// pages/firebase-permissions-test.tsx
import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

export default function FirebasePermissionsTest() {
  const [status, setStatus] = useState<string>('Loading...');
  const [logs, setLogs] = useState<string[]>([]);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [testResult, setTestResult] = useState<string>('Not started');

  // Initialize Firebase directly
  const firebaseConfig = {
    apiKey: "AIzaSyA0trAXY9TnPYkkDtZ2tK0DAYYWeZf2kPI",
    authDomain: "agencystrategy-95d3d.firebaseapp.com",
    projectId: "agencystrategy-95d3d",
    storageBucket: "agencystrategy-95d3d.appspot.com",
    messagingSenderId: "1090868022098",
    appId: "1:1090868022098:web:2dc833c626358be49e088b"
  };
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  // Initialize app on mount
  useEffect(() => {
    try {
      addLog('Initializing Firebase...');
      const app = initializeApp(firebaseConfig, 'permissionsTestApp');
      const auth = getAuth(app);
      
      addLog('Firebase initialized successfully');
      
      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          addLog(`User signed in: ${user.email}`);
          setCurrentUser(user);
          setStatus('Authenticated');
        } else {
          addLog('No user signed in');
          setCurrentUser(null);
          setStatus('Not authenticated');
        }
      });
      
      // Cleanup function
      return () => unsubscribe();
    } catch (error) {
      addLog(`Error initializing Firebase: ${error}`);
      setStatus('Error initializing Firebase');
    }
  }, []);

  const handleSignIn = async () => {
    if (!email || !password) {
      addLog('Email and password are required');
      return;
    }
    
    try {
      addLog(`Attempting to sign in with email: ${email}`);
      setStatus('Signing in...');
      
      const app = initializeApp(firebaseConfig, 'permissionsTestApp');
      const auth = getAuth(app);
      
      await signInWithEmailAndPassword(auth, email, password);
      addLog('Sign in successful');
    } catch (error: any) {
      addLog(`Sign in error: ${error.message}`);
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    try {
      addLog('Signing out...');
      setStatus('Signing out...');
      
      const app = initializeApp(firebaseConfig, 'permissionsTestApp');
      const auth = getAuth(app);
      
      await signOut(auth);
      addLog('Sign out successful');
    } catch (error: any) {
      addLog(`Sign out error: ${error.message}`);
      setStatus(`Error: ${error.message}`);
    }
  };

  const testFirestore = async () => {
    if (!currentUser) {
      addLog('Must be signed in to test Firestore permissions');
      return;
    }
    
    try {
      addLog('Testing Firestore permissions...');
      setTestResult('Testing...');
      
      const app = initializeApp(firebaseConfig, 'permissionsTestApp');
      const db = getFirestore(app);
      
      // Test reading user document
      addLog('Testing read user document...');
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        addLog('Successfully read user document');
      } else {
        addLog('User document does not exist');
      }
      
      // Test writing to a test collection
      addLog('Testing write to test collection...');
      const testDocRef = doc(db, 'test', `test_${Date.now()}`);
      await setDoc(testDocRef, {
        createdBy: currentUser.uid,
        timestamp: serverTimestamp(),
        message: 'Test document'
      });
      addLog('Successfully wrote test document');
      
      // Test listing collections
      addLog('Testing listing collections...');
      const usersCollectionRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollectionRef);
      addLog(`Successfully listed users collection: ${querySnapshot.size} documents found`);
      
      setTestResult('All tests passed!');
    } catch (error: any) {
      addLog(`Firestore test error: ${error.message}`);
      setTestResult(`Failed: ${error.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Firebase Permissions Test</h1>
      
      <div className="mb-4 p-3 bg-blue-100 rounded">
        <p><strong>Status:</strong> {status}</p>
      </div>
      
      {!currentUser ? (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl mb-3">Sign In</h2>
          <div className="mb-3">
            <label className="block mb-1">Email:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="border p-2 w-full"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1">Password:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="border p-2 w-full"
            />
          </div>
          <button 
            onClick={handleSignIn}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Sign In
          </button>
        </div>
      ) : (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl mb-3">Signed In</h2>
          <p><strong>Email:</strong> {currentUser.email}</p>
          <p><strong>UID:</strong> {currentUser.uid}</p>
          <div className="mt-3">
            <button 
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded mr-3"
            >
              Sign Out
            </button>
            
            <button 
              onClick={testFirestore}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Test Firestore Permissions
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p><strong>Test Result:</strong> {testResult}</p>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="text-xl mb-3">Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}