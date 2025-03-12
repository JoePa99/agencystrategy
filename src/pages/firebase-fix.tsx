// pages/firebase-fix.tsx
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

export default function FirebaseFix() {
  const [status, setStatus] = useState<string>('Initializing...');
  const [logs, setLogs] = useState<string[]>([]);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [hasUserDoc, setHasUserDoc] = useState(false);
  const [hasOrg, setHasOrg] = useState(false);

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

  // Initialize app on mount and set up auth listener
  useEffect(() => {
    try {
      addLog('Initializing Firebase with consistent app name...');
      // Use a consistent app name so auth state persists between renders
      const app = initializeApp(firebaseConfig, 'fixApp');
      const auth = getAuth(app);
      
      addLog('Setting up auth state listener...');
      
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          addLog(`Auth state changed: User signed in: ${user.email}`);
          setCurrentUser(user);
          setStatus('Authenticated');
          setShowLoginForm(false);
          
          // Check if user document exists
          const db = getFirestore(app);
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            addLog('User document exists in Firestore');
            setHasUserDoc(true);
            
            // Check if user has organization
            const userData = userDoc.data();
            if (userData.organizationId) {
              addLog(`User has organization: ${userData.organizationId}`);
              setHasOrg(true);
            } else {
              addLog('User has no organization linked to their profile');
              setHasOrg(false);
            }
          } else {
            addLog('User document does NOT exist in Firestore');
            setHasUserDoc(false);
            setHasOrg(false);
          }
        } else {
          addLog('Auth state changed: No user signed in');
          setCurrentUser(null);
          setStatus('Not authenticated');
          setShowLoginForm(true);
          setHasUserDoc(false);
          setHasOrg(false);
        }
      });
      
      // Cleanup subscription
      return () => unsubscribe();
    } catch (error: any) {
      addLog(`Error initializing Firebase: ${error.message}`);
      setStatus(`Error: ${error.message}`);
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
      
      // Use the same app name for consistency
      const app = initializeApp(firebaseConfig, 'fixApp');
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
      
      // Use the same app name for consistency
      const app = initializeApp(firebaseConfig, 'fixApp');
      const auth = getAuth(app);
      
      await signOut(auth);
      addLog('Sign out successful');
    } catch (error: any) {
      addLog(`Sign out error: ${error.message}`);
      setStatus(`Error: ${error.message}`);
    }
  };

  const createUserDocument = async () => {
    if (!currentUser) {
      addLog('No user is signed in');
      return;
    }
    
    try {
      addLog('Creating user document in Firestore...');
      setStatus('Creating user document...');
      
      // Use the same app name for consistency
      const app = initializeApp(firebaseConfig, 'fixApp');
      const db = getFirestore(app);
      
      // Create user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'New User',
        role: 'admin',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
      
      addLog('User document created successfully');
      setStatus('User document created');
      setHasUserDoc(true);
      
      // Verify creation
      const verifyDoc = await getDoc(userDocRef);
      if (verifyDoc.exists()) {
        addLog('Verified: User document exists now');
      }
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
      setStatus(`Error: ${error.message}`);
    }
  };
  
  const createOrganization = async () => {
    if (!currentUser) {
      addLog('No user is signed in');
      return;
    }
    
    try {
      addLog('Creating organization...');
      setStatus('Creating organization...');
      
      // Use the same app name for consistency
      const app = initializeApp(firebaseConfig, 'fixApp');
      const db = getFirestore(app);
      
      // Create organization
      const orgId = `org_${Date.now()}`;
      const orgRef = doc(db, 'organizations', orgId);
      
      await setDoc(orgRef, {
        name: 'Test Organization',
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        subscription: {
          plan: 'free',
          status: 'active'
        },
        settings: {
          aiFeatures: true,
          maxProjects: 3,
          maxUsers: 5,
          maxStorage: 1
        }
      });
      
      addLog(`Organization created with ID: ${orgId}`);
      
      // Add user as organization admin
      await setDoc(doc(db, 'organizations', orgId, 'members', currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin User',
        role: 'admin',
        joinedAt: serverTimestamp()
      });
      
      addLog('Added user as organization admin');
      
      // Update user profile with organization ID
      await setDoc(doc(db, 'users', currentUser.uid), {
        organizationId: orgId
      }, { merge: true });
      
      addLog('Updated user profile with organization ID');
      setStatus('Organization created and linked to user');
      setHasOrg(true);
      
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Firebase Account Fix Tool</h1>
      
      <div className="mb-4 p-3 bg-blue-100 rounded">
        <p><strong>Status:</strong> {status}</p>
      </div>
      
      {showLoginForm ? (
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
      ) : currentUser ? (
        <div className="mb-6">
          <div className="p-4 border rounded mb-4">
            <h2 className="text-xl mb-3">Signed In</h2>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>UID:</strong> {currentUser.uid}</p>
            <button 
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded mt-3"
            >
              Sign Out
            </button>
          </div>
          
          <div className="p-4 border rounded mb-4">
            <h2 className="text-xl mb-3">Fix Account</h2>
            
            <div className="flex items-center mb-4">
              <div className={`w-6 h-6 rounded-full mr-3 ${hasUserDoc ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>User Document in Firestore: {hasUserDoc ? 'Found' : 'Missing'}</span>
            </div>
            
            <div className="flex items-center mb-4">
              <div className={`w-6 h-6 rounded-full mr-3 ${hasOrg ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Organization: {hasOrg ? 'Found' : 'Missing'}</span>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={createUserDocument}
                disabled={hasUserDoc}
                className={`px-4 py-2 rounded ${hasUserDoc ? 'bg-gray-300' : 'bg-blue-500 text-white'}`}
              >
                {hasUserDoc ? 'User Document Created' : 'Create User Document'}
              </button>
              
              <button 
                onClick={createOrganization}
                disabled={!hasUserDoc || hasOrg}
                className={`px-4 py-2 rounded ${!hasUserDoc || hasOrg ? 'bg-gray-300' : 'bg-green-500 text-white'}`}
              >
                {hasOrg ? 'Organization Created' : 'Create Organization'}
              </button>
            </div>
          </div>
          
          <div className="p-4 border rounded">
            <h2 className="text-xl mb-3">Next Steps</h2>
            {hasUserDoc && hasOrg ? (
              <div>
                <p className="text-green-600 font-bold mb-2">🎉 Your account has been fixed successfully!</p>
                <p>You can now:</p>
                <ol className="list-decimal pl-5 mt-2">
                  <li className="mb-1">Go to <a href="/login" className="text-blue-500 underline">the regular login page</a></li>
                  <li className="mb-1">Sign in with your credentials</li>
                  <li>You should be redirected to the dashboard without errors</li>
                </ol>
              </div>
            ) : (
              <p>Please complete the steps above to fix your account.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 border rounded">
          <p>Checking authentication status...</p>
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