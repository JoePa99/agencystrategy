// pages/direct-fix.tsx - Direct database fix tool
import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp 
} from 'firebase/firestore';

export default function DirectFix() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('Ready to fix organization link');
  const [orgId, setOrgId] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const handleDirectFix = async () => {
    if (!email || !password) {
      addLog('Email and password are required');
      setStatus('Error: Email and password are required');
      return;
    }

    if (!orgId) {
      addLog('Organization ID is required');
      setStatus('Error: Organization ID is required');
      return;
    }

    try {
      addLog('Starting direct database fix...');
      setStatus('Working...');

      // Initialize Firebase
      const firebaseConfig = {
        apiKey: "AIzaSyA0trAXY9TnPYkkDtZ2tK0DAYYWeZf2kPI",
        authDomain: "agencystrategy-95d3d.firebaseapp.com",
        projectId: "agencystrategy-95d3d",
        storageBucket: "agencystrategy-95d3d.appspot.com",
        messagingSenderId: "1090868022098",
        appId: "1:1090868022098:web:2dc833c626358be49e088b"
      };
      
      // Initialize Firebase with unique name to avoid conflicts
      const app = initializeApp(firebaseConfig, 'directFix' + Date.now());
      const auth = getAuth(app);
      const db = getFirestore(app);

      // 1. Sign in to get the current user
      addLog('Signing in...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      addLog(`Signed in as: ${user.email} (${user.uid})`);

      // 2. Check if the organization exists
      const orgDocRef = doc(db, 'organizations', orgId);
      const orgDoc = await getDoc(orgDocRef);
      
      if (!orgDoc.exists()) {
        addLog(`ERROR: Organization with ID ${orgId} does not exist`);
        // Try to create it
        addLog('Creating organization...');
        await setDoc(orgDocRef, {
          name: 'My Organization',
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          subscription: {
            plan: 'free',
            status: 'active'
          },
          settings: {
            aiFeatures: true,
            maxProjects: 5,
            maxUsers: 10,
            maxStorage: 5
          }
        });
        addLog(`Created organization with ID: ${orgId}`);
      } else {
        addLog(`Found organization: ${orgDoc.data().name || 'Unnamed'}`);
      }

      // 3. Check if the user is a member of the organization
      const memberDocRef = doc(db, 'organizations', orgId, 'members', user.uid);
      const memberDoc = await getDoc(memberDocRef);
      
      if (!memberDoc.exists()) {
        addLog('User is not a member of this organization. Adding as admin...');
        await setDoc(memberDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Admin User',
          role: 'admin',
          joinedAt: serverTimestamp()
        });
        addLog('Added user as organization admin');
      } else {
        addLog('User is already a member of this organization');
      }

      // 4. Update user document with organization ID and proper fields
      addLog('Updating user document with organization ID...');
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Admin User',
        role: 'admin',
        organizationId: orgId,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      }, { merge: false }); // Use merge: false to completely replace the document
      
      addLog('User document updated with organization ID');
      
      // 5. Verify the user document was updated
      const updatedUserDoc = await getDoc(userDocRef);
      if (updatedUserDoc.exists() && updatedUserDoc.data().organizationId === orgId) {
        addLog('✅ Verification successful: User document has the correct organization ID');
        setStatus('Success! Organization link fixed.');
      } else {
        addLog('⚠️ Verification failed: User document does not have the correct organization ID');
        setStatus('Error: Failed to verify organization link');
      }
      
      // 6. List all users in the database for debugging
      addLog('Listing all users...');
      const usersSnapshot = await getDocs(collection(db, 'users'));
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        addLog(`User: ${userData.email} | Org ID: ${userData.organizationId || 'NONE'}`);
      });
      
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Direct Database Fix Tool</h1>
      
      <div className="mb-4 p-3 bg-blue-100 rounded">
        <p><strong>Status:</strong> {status}</p>
      </div>
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl mb-3">Fix Organization Link Directly</h2>
        <p className="mb-4">This tool will directly update your user document with the specified organization ID.</p>
        
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
        
        <div className="mb-3">
          <label className="block mb-1">Organization ID (e.g. "org_1708934857585"):</label>
          <input 
            type="text" 
            value={orgId} 
            onChange={(e) => setOrgId(e.target.value)} 
            className="border p-2 w-full"
            placeholder="org_1234567890"
          />
        </div>
        
        <button 
          onClick={handleDirectFix}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Apply Direct Fix
        </button>
      </div>
      
      <div className="p-4 border rounded">
        <h2 className="text-xl mb-3">Instructions</h2>
        <ol className="list-decimal pl-5">
          <li className="mb-1">Enter your email and password</li>
          <li className="mb-1">Enter the organization ID (check the logs from previous fix attempts to find existing IDs)</li>
          <li className="mb-1">Click "Apply Direct Fix" to completely rewrite your user document</li>
          <li className="mb-1">After the fix, go to <a href="/login" className="text-blue-500 underline">the regular login page</a></li>
          <li>Try creating a project</li>
        </ol>
      </div>
      
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