// pages/fix-organization.tsx
import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  getDocs,
  query,
  serverTimestamp 
} from 'firebase/firestore';

export default function FixOrganization() {
  const [status, setStatus] = useState<string>('Initializing...');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Initialize Firebase and set up auth listener
  useEffect(() => {
    try {
      addLog('Initializing Firebase for organization fix...');
      const app = initializeApp(firebaseConfig, 'orgFixApp');
      const auth = getAuth(app);
      const db = getFirestore(app);
      
      addLog('Setting up auth state listener...');
      
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          addLog(`User signed in: ${user.email}`);
          setCurrentUser(user);
          setStatus('Checking organization status...');
          
          // Check user profile for organization ID
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.organizationId) {
              addLog(`User has organization ID: ${userData.organizationId}`);
              setUserOrgId(userData.organizationId);
              
              // Check if organization document exists
              const orgDocRef = doc(db, 'organizations', userData.organizationId);
              try {
                const orgDoc = await getDoc(orgDocRef);
                if (orgDoc.exists()) {
                  addLog(`Organization document exists: ${orgDoc.data().name}`);
                } else {
                  addLog(`Warning: Organization document does not exist for ID: ${userData.organizationId}`);
                }
              } catch (err) {
                addLog(`Error checking organization: ${err}`);
              }
            } else {
              addLog('User profile exists but organization ID is missing');
              setUserOrgId(null);
            }
          } else {
            addLog('User document does not exist');
            setUserOrgId(null);
          }
          
          // Fetch all organizations
          try {
            const orgsQuery = query(collection(db, 'organizations'));
            const orgsSnapshot = await getDocs(orgsQuery);
            const orgs = orgsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setOrganizations(orgs);
            addLog(`Found ${orgs.length} organizations in database`);
          } catch (err) {
            addLog(`Error fetching organizations: ${err}`);
          }
          
          setLoading(false);
        } else {
          addLog('No user signed in');
          setCurrentUser(null);
          setUserOrgId(null);
          setOrganizations([]);
          setStatus('Not authenticated - please use /firebase-fix first');
          setLoading(false);
        }
      });
      
      return () => unsubscribe();
    } catch (error: any) {
      addLog(`Error initializing Firebase: ${error.message}`);
      setStatus(`Error: ${error.message}`);
      setLoading(false);
    }
  }, []);

  const createNewOrganization = async () => {
    if (!currentUser) {
      addLog('No user signed in');
      return;
    }
    
    try {
      addLog('Creating new organization...');
      setStatus('Creating organization...');
      
      const app = initializeApp(firebaseConfig, 'orgFixApp');
      const db = getFirestore(app);
      
      // Create organization
      const orgId = `org_${Date.now()}`;
      const orgRef = doc(db, 'organizations', orgId);
      
      await setDoc(orgRef, {
        name: 'My Organization',
        createdBy: currentUser.uid,
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
        organizationId: orgId,
        role: 'admin',
        // Ensure these fields are set properly
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin User',
        lastLoginAt: serverTimestamp()
      }, { merge: true });
      
      addLog('Updated user profile with organization ID');
      setStatus('Organization created and linked to user');
      setUserOrgId(orgId);
      
      // Refresh organizations list
      const orgsQuery = query(collection(db, 'organizations'));
      const orgsSnapshot = await getDocs(orgsQuery);
      const orgs = orgsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrganizations(orgs);
      
    } catch (error: any) {
      addLog(`Error creating organization: ${error.message}`);
      setStatus(`Error: ${error.message}`);
    }
  };

  const linkToExistingOrganization = async (orgId: string) => {
    if (!currentUser) {
      addLog('No user signed in');
      return;
    }
    
    try {
      addLog(`Linking user to organization: ${orgId}`);
      setStatus('Linking to organization...');
      
      const app = initializeApp(firebaseConfig, 'orgFixApp');
      const db = getFirestore(app);
      
      // Add user as organization admin if not already added
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
        organizationId: orgId,
        role: 'admin',
        // Ensure these fields are set properly
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin User',
        lastLoginAt: serverTimestamp()
      }, { merge: true });
      
      addLog('Updated user profile with organization ID');
      setStatus('User linked to organization');
      setUserOrgId(orgId);
      
    } catch (error: any) {
      addLog(`Error linking to organization: ${error.message}`);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Fix Organization Link</h1>
      
      <div className="mb-4 p-3 bg-blue-100 rounded">
        <p><strong>Status:</strong> {status}</p>
        
        {userOrgId && (
          <p className="mt-2"><strong>Current Organization ID:</strong> {userOrgId}</p>
        )}
      </div>
      
      {loading ? (
        <div className="animate-pulse bg-gray-200 p-4 mb-4 rounded">
          <p>Loading user data...</p>
        </div>
      ) : !currentUser ? (
        <div className="mb-6 p-4 border border-red-300 bg-red-50 rounded">
          <p className="text-red-700">
            You must first sign in using the <a href="/firebase-fix" className="underline font-medium">Firebase Fix Tool</a>.
          </p>
        </div>
      ) : (
        <div className="mb-6">
          <div className="p-4 border rounded mb-4">
            <h2 className="text-xl mb-3">User Information</h2>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>UID:</strong> {currentUser.uid}</p>
            <p><strong>Organization Status:</strong> {userOrgId ? 'Linked' : 'Not linked'}</p>
          </div>
          
          <div className="p-4 border rounded mb-4">
            <h2 className="text-xl mb-3">Fix Organization Link</h2>
            
            {userOrgId ? (
              <div className="bg-green-50 border border-green-200 p-3 rounded mb-4">
                <p className="text-green-700">
                  Your user account is already linked to an organization ({userOrgId}).
                </p>
                <p className="text-green-700 mt-2">
                  You should be able to access the dashboard and create projects now.
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4">Your user account is not linked to an organization. You can:</p>
                
                <button 
                  onClick={createNewOrganization}
                  className="bg-blue-500 text-white px-4 py-2 rounded mb-6"
                >
                  Create New Organization
                </button>
                
                {organizations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Or link to an existing organization:</h3>
                    <div className="space-y-2">
                      {organizations.map(org => (
                        <div key={org.id} className="border p-3 rounded flex justify-between items-center">
                          <div>
                            <p><strong>Name:</strong> {org.name || 'Unnamed Organization'}</p>
                            <p className="text-sm text-gray-500">ID: {org.id}</p>
                          </div>
                          <button 
                            onClick={() => linkToExistingOrganization(org.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded"
                          >
                            Link
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="p-4 border rounded">
            <h2 className="text-xl mb-3">Next Steps</h2>
            {userOrgId ? (
              <div>
                <p className="text-green-600 font-bold mb-2">✅ Organization link fixed!</p>
                <p>You can now:</p>
                <ol className="list-decimal pl-5 mt-2">
                  <li className="mb-1">Go to <a href="/login" className="text-blue-500 underline">the regular login page</a></li>
                  <li className="mb-1">Sign in with your credentials</li>
                  <li className="mb-1">You should be redirected to the dashboard</li>
                  <li>Try creating a project</li>
                </ol>
              </div>
            ) : (
              <p>Please complete the steps above to link your account to an organization.</p>
            )}
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