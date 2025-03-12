// pages/complete-fix.tsx - All-in-one fix tool for Firebase authentication, user document, and organization
import { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
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
  query,
  serverTimestamp 
} from 'firebase/firestore';

export default function CompleteFix() {
  const [status, setStatus] = useState<string>('Initializing...');
  const [logs, setLogs] = useState<string[]>([]);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [hasUserDoc, setHasUserDoc] = useState(false);
  const [hasOrg, setHasOrg] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'auth' | 'userDoc' | 'org'>('auth');

  // Initialize Firebase directly with a CONSISTENT name
  const APP_NAME = 'completeFix';
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

  // Get or create the Firebase app with the consistent name
  const getFirebaseApp = () => {
    try {
      if (getApps().find(app => app.name === APP_NAME)) {
        return getApp(APP_NAME);
      } else {
        return initializeApp(firebaseConfig, APP_NAME);
      }
    } catch (error) {
      addLog(`Error getting Firebase app: ${error}`);
      return initializeApp(firebaseConfig, APP_NAME);
    }
  };

  // Initialize app on mount and set up auth listener
  useEffect(() => {
    try {
      addLog('Initializing Firebase...');
      // Use a consistent app instance
      const app = getFirebaseApp();
      const auth = getAuth(app);
      
      addLog('Setting up auth state listener...');
      
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          addLog(`User signed in: ${user.email}`);
          setCurrentUser(user);
          setStatus('Authenticated');
          setShowLoginForm(false);
          setActiveSection('userDoc');
          
          // Check user document
          await checkUserDocument(user);
          
          // Load organizations
          await loadOrganizations();
          
          setLoading(false);
        } else {
          addLog('No user signed in');
          setCurrentUser(null);
          setUserOrgId(null);
          setOrganizations([]);
          setStatus('Not authenticated');
          setShowLoginForm(true);
          setHasUserDoc(false);
          setHasOrg(false);
          setActiveSection('auth');
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

  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  
  const checkUserDocument = async (user: User) => {
    try {
      addLog('Checking user document...');
      
      const app = getFirebaseApp();
      const db = getFirestore(app);
      
      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        addLog('User document exists in Firestore');
        setHasUserDoc(true);
        
        // Check if user has organization
        const userData = userDoc.data();
        if (userData.organizationId) {
          addLog(`User has organization ID: ${userData.organizationId}`);
          setUserOrgId(userData.organizationId);
          setHasOrg(true);
          setActiveSection('org');
          
          // Check if organization document exists
          try {
            const orgDocRef = doc(db, 'organizations', userData.organizationId);
            const orgDoc = await getDoc(orgDocRef);
            if (orgDoc.exists()) {
              addLog(`Organization document exists: ${orgDoc.data().name || 'Unnamed'}`);
            } else {
              addLog(`Warning: Organization document does not exist for ID: ${userData.organizationId}`);
              setHasOrg(false);
            }
          } catch (err) {
            addLog(`Error checking organization: ${err}`);
          }
        } else {
          addLog('User profile exists but organization ID is missing');
          setUserOrgId(null);
          setHasOrg(false);
          setActiveSection('org');
        }
      } else {
        addLog('User document does not exist in Firestore');
        setHasUserDoc(false);
        setHasOrg(false);
        setUserOrgId(null);
      }
    } catch (error: any) {
      addLog(`Error checking user document: ${error.message}`);
    }
  };
  
  const loadOrganizations = async () => {
    try {
      addLog('Loading existing organizations...');
      
      const app = getFirebaseApp();
      const db = getFirestore(app);
      
      // Fetch all organizations
      const orgsQuery = query(collection(db, 'organizations'));
      const orgsSnapshot = await getDocs(orgsQuery);
      const orgs = orgsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrganizations(orgs);
      addLog(`Found ${orgs.length} organizations in database`);
    } catch (error: any) {
      addLog(`Error loading organizations: ${error.message}`);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      addLog('Email and password are required');
      return;
    }
    
    try {
      addLog(`Attempting to sign in with email: ${email}`);
      setStatus('Signing in...');
      
      const app = getFirebaseApp();
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
      
      const app = getFirebaseApp();
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
      
      const app = getFirebaseApp();
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
      setActiveSection('org');
      
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
  
  const createNewOrganization = async () => {
    if (!currentUser) {
      addLog('No user is signed in');
      return;
    }
    
    try {
      addLog('Creating new organization...');
      setStatus('Creating organization...');
      
      const app = getFirebaseApp();
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
      setHasOrg(true);
      
      // Refresh organizations list
      await loadOrganizations();
      
    } catch (error: any) {
      addLog(`Error creating organization: ${error.message}`);
      setStatus(`Error: ${error.message}`);
    }
  };

  const linkToExistingOrganization = async (orgId: string) => {
    if (!currentUser) {
      addLog('No user is signed in');
      return;
    }
    
    try {
      addLog(`Linking user to organization: ${orgId}`);
      setStatus('Linking to organization...');
      
      const app = getFirebaseApp();
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
      setHasOrg(true);
      
    } catch (error: any) {
      addLog(`Error linking to organization: ${error.message}`);
      setStatus(`Error: ${error.message}`);
    }
  };
  
  // Render helper for the current step indicator
  const renderStepIndicator = () => {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-3">Fix Process</h2>
        <div className="flex items-center">
          <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentUser ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
            1
          </div>
          <div className="h-1 w-8 bg-gray-300"></div>
          <div className={`rounded-full h-10 w-10 flex items-center justify-center ${hasUserDoc ? 'bg-green-500 text-white' : activeSection === 'userDoc' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
            2
          </div>
          <div className="h-1 w-8 bg-gray-300"></div>
          <div className={`rounded-full h-10 w-10 flex items-center justify-center ${hasOrg ? 'bg-green-500 text-white' : activeSection === 'org' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
            3
          </div>
        </div>
        <div className="flex text-sm mt-1">
          <div className="flex-1 text-center">Authentication</div>
          <div className="flex-1 text-center">User Document</div>
          <div className="flex-1 text-center">Organization</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Complete Firebase Fix Tool</h1>
      
      <div className="mb-4 p-3 bg-blue-100 rounded">
        <p><strong>Status:</strong> {status}</p>
        
        {userOrgId && (
          <p className="mt-2"><strong>Current Organization ID:</strong> {userOrgId}</p>
        )}
      </div>
      
      {renderStepIndicator()}
      
      {showLoginForm ? (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl mb-3">Step 1: Sign In</h2>
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
        <div className="mb-6">
          <div className="p-4 border rounded mb-4">
            <h2 className="text-xl mb-3">Step 1: Authentication</h2>
            <div className="bg-green-50 border border-green-200 p-3 rounded">
              <p className="text-green-700">
                ✅ Signed in as: {currentUser?.email}
              </p>
            </div>
            <button 
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded mt-3"
            >
              Sign Out
            </button>
          </div>
          
          <div className="p-4 border rounded mb-4">
            <h2 className="text-xl mb-3">Step 2: User Document</h2>
            
            {hasUserDoc ? (
              <div className="bg-green-50 border border-green-200 p-3 rounded">
                <p className="text-green-700">
                  ✅ User document exists in Firestore
                </p>
              </div>
            ) : (
              <div>
                <p className="mb-4">Your user document is missing in Firestore. This is required for the application to work.</p>
                <button 
                  onClick={createUserDocument}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Create User Document
                </button>
              </div>
            )}
          </div>
          
          <div className="p-4 border rounded mb-4">
            <h2 className="text-xl mb-3">Step 3: Organization</h2>
            
            {hasOrg ? (
              <div className="bg-green-50 border border-green-200 p-3 rounded mb-4">
                <p className="text-green-700">
                  ✅ Your user account is linked to organization: {userOrgId}
                </p>
              </div>
            ) : hasUserDoc ? (
              <>
                <p className="mb-4">Your user account needs to be linked to an organization. You can:</p>
                
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
            ) : (
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-gray-600">
                  Please complete Step 2 first.
                </p>
              </div>
            )}
          </div>
          
          <div className="p-4 border rounded">
            <h2 className="text-xl mb-3">Next Steps</h2>
            {hasUserDoc && hasOrg ? (
              <div>
                <p className="text-green-600 font-bold mb-2">🎉 Your account has been completely fixed!</p>
                <p>You can now:</p>
                <ol className="list-decimal pl-5 mt-2">
                  <li className="mb-1">Go to <a href="/login" className="text-blue-500 underline">the regular login page</a></li>
                  <li className="mb-1">Sign in with your credentials</li>
                  <li className="mb-1">You should be redirected to the dashboard</li>
                  <li>Try creating a project</li>
                </ol>
              </div>
            ) : (
              <p>Please complete all the steps above to fix your account.</p>
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