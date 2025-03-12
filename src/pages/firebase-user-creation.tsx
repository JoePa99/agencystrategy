// pages/firebase-user-creation.tsx
import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function FirebaseUserCreation() {
  const [status, setStatus] = useState('Ready to create user document');
  const [logs, setLogs] = useState<string[]>([]);

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

  const checkCurrentUser = async () => {
    try {
      addLog('Initializing Firebase...');
      const app = initializeApp(firebaseConfig, 'userCreationApp');
      const auth = getAuth(app);
      
      addLog('Checking current user...');
      
      if (!auth.currentUser) {
        addLog('No user is signed in. Please sign in first using the permissions test page.');
        setStatus('Error: No user is signed in');
        return;
      }
      
      const user = auth.currentUser;
      addLog(`Current user: ${user.email} (${user.uid})`);
      
      // Check if user document exists
      const db = getFirestore(app);
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        addLog('User document already exists');
        setStatus('User document exists');
        return;
      }
      
      addLog('User document does not exist. Creating one now...');
      
      // Create user document
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'New User',
        role: 'admin',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
      
      addLog('User document created successfully');
      setStatus('Success: User document created');
      
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
  
  const createTestOrganization = async () => {
    try {
      addLog('Initializing Firebase...');
      const app = initializeApp(firebaseConfig, 'userCreationApp');
      const auth = getAuth(app);
      const db = getFirestore(app);
      
      if (!auth.currentUser) {
        addLog('No user is signed in. Please sign in first.');
        return;
      }
      
      const user = auth.currentUser;
      addLog(`Creating organization for user: ${user.email}`);
      
      // Create organization
      const orgId = `org_${Date.now()}`;
      const orgRef = doc(db, 'organizations', orgId);
      
      await setDoc(orgRef, {
        name: 'Test Organization',
        createdBy: user.uid,
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
      await setDoc(doc(db, 'organizations', orgId, 'members', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Admin User',
        role: 'admin',
        joinedAt: serverTimestamp()
      });
      
      addLog('Added user as organization admin');
      
      // Update user profile with organization ID
      await setDoc(doc(db, 'users', user.uid), {
        organizationId: orgId
      }, { merge: true });
      
      addLog('Updated user profile with organization ID');
      setStatus('Success: Organization created and linked to user');
      
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Firebase User Document Creation</h1>
      
      <div className="mb-4 p-3 bg-blue-100 rounded">
        <p><strong>Status:</strong> {status}</p>
      </div>
      
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={checkCurrentUser}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create User Document
        </button>
        
        <button 
          onClick={createTestOrganization}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Create Test Organization
        </button>
      </div>
      
      <p className="mb-4 text-sm">
        Note: You must first sign in using the <a href="/firebase-permissions-test" className="text-blue-500 underline">Firebase Permissions Test</a> page.
      </p>
      
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