// src/pages/debug-profile.tsx
import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';

export default function DebugProfile() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [profileData, setProfileData] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const firebaseConfig = {
    apiKey: "AIzaSyA0trAXY9TnPYkkDtZ2tK0DAYYWeZf2kPI",
    authDomain: "agencystrategy-95d3d.firebaseapp.com",
    projectId: "agencystrategy-95d3d",
    storageBucket: "agencystrategy-95d3d.appspot.com",
    messagingSenderId: "1090868022098",
    appId: "1:1090868022098:web:2dc833c626358be49e088b"
  };

  // Initialize Firebase
  let app: any;
  try {
    if (typeof window !== 'undefined') {
      // Check for existing app instance
      try {
        app = initializeApp(firebaseConfig, 'debug-profile');
      } catch (error) {
        console.error("Failed to initialize Firebase app:", error);
      }
    }
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    if (!app) return;
    
    addLog('Setting up auth state listener');
    const auth = getAuth(app);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        addLog(`User is signed in: ${user.email}`);
        setIsLoggedIn(true);
        setUserId(user.uid);
        fetchUserProfile(user.uid);
      } else {
        addLog('User is signed out');
        setIsLoggedIn(false);
        setUserId('');
        setProfileData(null);
      }
    });
    
    return () => unsubscribe();
  }, [app]);

  const fetchUserProfile = async (uid: string) => {
    try {
      addLog(`Fetching user profile for UID: ${uid}`);
      const db = getFirestore(app);
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        addLog('User profile found');
        setProfileData(data);
      } else {
        addLog('User profile does not exist');
        setProfileData(null);
      }
    } catch (error) {
      addLog(`Error fetching profile: ${error}`);
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      addLog(`Attempting to sign in with email: ${email}`);
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
      addLog('Sign in successful');
    } catch (error: any) {
      addLog(`Sign in error: ${error.message}`);
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      addLog('Signing out');
      const auth = getAuth(app);
      await signOut(auth);
      addLog('Sign out successful');
    } catch (error) {
      addLog(`Sign out error: ${error}`);
      console.error('Logout error:', error);
    }
  };

  const listAllUsers = async () => {
    try {
      addLog('Listing all users in the database');
      const db = getFirestore(app);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        addLog(`User: ${userData.email || 'Unknown'} | UID: ${doc.id} | Org ID: ${userData.organizationId || 'NONE'}`);
      });
      
      addLog(`Found ${usersSnapshot.size} user(s) in total`);
    } catch (error) {
      addLog(`Error listing users: ${error}`);
      console.error('Error listing users:', error);
    }
  };

  const fixUserProfile = async () => {
    if (!isLoggedIn || !userId) {
      addLog('Cannot fix profile: User not logged in');
      return;
    }
    
    try {
      addLog('Attempting to fix user profile');
      const db = getFirestore(app);
      
      // 1. Find or create an organization
      let orgId = '';
      addLog('Looking for existing organizations');
      const orgsSnapshot = await getDocs(collection(db, 'organizations'));
      
      if (orgsSnapshot.empty) {
        addLog('No organizations found. Creating a new one.');
        orgId = `org_${Date.now()}`;
        const orgRef = doc(db, 'organizations', orgId);
        
        await setDoc(orgRef, {
          name: 'Default Organization',
          createdBy: userId,
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
        
        addLog(`Created new organization with ID: ${orgId}`);
      } else {
        // Use the first organization found
        const firstOrg = orgsSnapshot.docs[0];
        orgId = firstOrg.id;
        addLog(`Using existing organization: ${orgId}`);
      }
      
      // 2. Add user as organization admin
      const memberRef = doc(db, 'organizations', orgId, 'members', userId);
      const memberDoc = await getDoc(memberRef);
      
      if (!memberDoc.exists()) {
        addLog('Adding user as organization admin');
        await setDoc(memberRef, {
          uid: userId,
          role: 'admin',
          joinedAt: serverTimestamp()
        });
      } else {
        addLog('User is already a member of the organization');
      }
      
      // 3. Update the user profile
      const userRef = doc(db, 'users', userId);
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (!user) {
        addLog('Cannot access current user');
        return;
      }
      
      addLog('Updating user profile with organization ID');
      
      await setDoc(userRef, {
        uid: userId,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        role: 'admin',
        organizationId: orgId,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
      
      addLog('User profile updated successfully');
      
      // 4. Verify the changes
      await fetchUserProfile(userId);
    } catch (error) {
      addLog(`Error fixing profile: ${error}`);
      console.error('Error fixing profile:', error);
    }
  };

  const showRawProfile = async () => {
    try {
      addLog('Fetching raw profile data directly from Firestore');
      const db = getFirestore(app);
      const auth = getAuth(app);
      
      if (!auth.currentUser) {
        addLog('No user is signed in');
        return;
      }
      
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        addLog('Raw user profile data:');
        addLog(JSON.stringify(userData, null, 2));
      } else {
        addLog('User document does not exist in Firestore');
      }
    } catch (error) {
      addLog(`Error: ${error}`);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">User Profile Debugger</h1>
      
      {!isLoggedIn ? (
        <div className="bg-white shadow rounded-lg p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">Sign In</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white shadow rounded-lg p-6 mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">User Profile</h2>
              <button
                onClick={handleLogout}
                className="py-1 px-3 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
            
            <div className="mt-4">
              <div className="text-sm text-gray-500">User ID:</div>
              <div className="font-mono text-sm">{userId}</div>
            </div>
            
            {profileData ? (
              <div className="mt-4">
                <h3 className="text-lg font-medium">Profile Data:</h3>
                <div className="mt-2 p-3 bg-gray-100 rounded overflow-auto">
                  <pre className="text-sm">{JSON.stringify(profileData, null, 2)}</pre>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
                  <h4 className="font-medium text-yellow-800">Organization Status:</h4>
                  {profileData.organizationId ? (
                    <p className="text-green-700">✅ User has organization ID: {profileData.organizationId}</p>
                  ) : (
                    <p className="text-red-700">❌ User has no organization ID</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded">
                <p className="text-red-700">No profile data found for this user</p>
              </div>
            )}
            
            <div className="mt-6 flex space-x-3">
              <button
                onClick={fixUserProfile}
                className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Fix Profile
              </button>
              <button
                onClick={showRawProfile}
                className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Show Raw Profile
              </button>
              <button
                onClick={listAllUsers}
                className="py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                List All Users
              </button>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Debug Logs</h2>
            <div className="bg-black text-green-400 p-3 rounded h-64 overflow-y-auto font-mono text-xs">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}