// src/pages/fix-all.tsx - Ultra simplified standalone page
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';

export default function FixAll() {
  // Basic state
  const [step, setStep] = useState('login'); // 'login', 'profile', 'org', 'project'
  const [message, setMessage] = useState('Sign in to get started');
  const [error, setError] = useState('');
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  
  // Project state
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  
  // Debug state
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp}: ${message}`);
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
  };
  
  // Firebase configuration - hardcoded for reliability
  const firebaseConfig = {
    apiKey: "AIzaSyA0trAXY9TnPYkkDtZ2tK0DAYYWeZf2kPI",
    authDomain: "agencystrategy-95d3d.firebaseapp.com",
    projectId: "agencystrategy-95d3d",
    storageBucket: "agencystrategy-95d3d.appspot.com",
    messagingSenderId: "1090868022098",
    appId: "1:1090868022098:web:2dc833c626358be49e088b"
  };

  // Initialize Firebase only once
  let app: any;
  let auth: any;
  let db: any;
  
  useEffect(() => {
    try {
      addLog('Initializing Firebase');
      app = initializeApp(firebaseConfig, 'fixAll' + Date.now());
      auth = getAuth(app);
      db = getFirestore(app);
      
      addLog('Setting up auth state listener');
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          addLog(`User signed in: ${user.email}`);
          setUser(user);
          await checkUserProfile(user.uid);
        } else {
          addLog('No user signed in');
          setUser(null);
          setStep('login');
        }
      });
      
      return () => unsubscribe();
    } catch (error: any) {
      addLog(`Error initializing Firebase: ${error.message}`);
      setError(`Error initializing Firebase: ${error.message}`);
    }
  }, []);

  const checkUserProfile = async (uid: string) => {
    try {
      addLog('Checking user profile');
      
      const userDocRef = doc(db, 'users', uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        addLog(`Found user profile. Organization ID: ${userData.organizationId || 'NONE'}`);
        
        if (userData.organizationId) {
          // Check if organization exists
          const orgRef = doc(db, 'organizations', userData.organizationId);
          const orgSnapshot = await getDoc(orgRef);
          
          if (orgSnapshot.exists()) {
            addLog(`Organization exists: ${orgSnapshot.data().name}`);
            setStep('project');
            setMessage('Create a new project');
          } else {
            addLog('Organization ID exists but organization not found');
            setStep('org');
            setMessage('Create an organization');
          }
        } else {
          addLog('User profile exists but no organization ID');
          setStep('org');
          setMessage('Create an organization');
        }
      } else {
        addLog('User profile does not exist');
        setStep('profile');
        setMessage('Create your user profile');
      }
    } catch (error: any) {
      addLog(`Error checking profile: ${error.message}`);
      setError(`Error checking profile: ${error.message}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      addLog(`Attempting to sign in with email: ${email}`);
      
      const app = initializeApp(firebaseConfig, 'fixAll' + Date.now());
      const auth = getAuth(app);
      
      await signInWithEmailAndPassword(auth, email, password);
      addLog('Sign in successful');
    } catch (error: any) {
      addLog(`Sign in error: ${error.message}`);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const app = initializeApp(firebaseConfig, 'fixAll' + Date.now());
      const auth = getAuth(app);
      await signOut(auth);
      addLog('Signed out successfully');
    } catch (error: any) {
      addLog(`Sign out error: ${error.message}`);
      setError(error.message);
    }
  };

  const createUserProfile = async () => {
    if (!user) {
      setError('You must be signed in to create a profile');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      addLog('Creating user profile');
      
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'New User',
        role: 'admin',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
      
      addLog('User profile created successfully');
      setStep('org');
      setMessage('Now create an organization');
    } catch (error: any) {
      addLog(`Error creating profile: ${error.message}`);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createOrganization = async () => {
    if (!user) {
      setError('You must be signed in to create an organization');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      addLog('Creating organization');
      
      // Create organization
      const orgId = `org_${Date.now()}`;
      const orgRef = doc(db, 'organizations', orgId);
      
      await setDoc(orgRef, {
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
      setStep('project');
      setMessage('Now create a project');
    } catch (error: any) {
      addLog(`Error creating organization: ${error.message}`);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be signed in to create a project');
      return;
    }
    
    if (!name || !client || !description) {
      setError('All fields are required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      addLog('Getting organization ID');
      
      // Get user profile to get organization ID
      const userDocRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (!userSnapshot.exists()) {
        throw new Error('User profile not found');
      }
      
      const userData = userSnapshot.data();
      const organizationId = userData.organizationId;
      
      if (!organizationId) {
        throw new Error('No organization ID found');
      }
      
      addLog(`Using organization ID: ${organizationId}`);
      
      // Create project using addDoc for simplicity
      const projectsRef = collection(db, 'projects');
      const projectDoc = await addDoc(projectsRef, {
        name,
        description,
        client,
        organizationId,
        createdBy: user.uid,
        status: 'active',
        members: {
          [user.uid]: 'owner'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      addLog(`Project created with ID: ${projectDoc.id}`);
      setMessage(`Success! Project "${name}" created with ID: ${projectDoc.id}`);
      
      // Clear form
      setName('');
      setClient('');
      setDescription('');
    } catch (error: any) {
      addLog(`Error creating project: ${error.message}`);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Fix All Firebase Issues</title>
      </Head>
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">All-in-One Firebase Fix</h1>
        <p className="mb-6 text-gray-600">This page will help you fix all Firebase issues with your account.</p>
        
        <div className="mb-6 bg-blue-100 p-4 rounded-lg">
          <div className="font-medium">Current Step: {step}</div>
          <div>{message}</div>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-100 p-4 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        {/* Login Form */}
        {step === 'login' && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
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
                disabled={isLoading}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        )}
        
        {/* Create Profile */}
        {step === 'profile' && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Create User Profile</h2>
            <p className="mb-4 text-gray-600">
              Your user account exists, but you don't have a profile in the database.
            </p>
            <button
              onClick={createUserProfile}
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating Profile...' : 'Create User Profile'}
            </button>
          </div>
        )}
        
        {/* Create Organization */}
        {step === 'org' && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Create Organization</h2>
            <p className="mb-4 text-gray-600">
              You need an organization to create projects.
            </p>
            <button
              onClick={createOrganization}
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating Organization...' : 'Create Organization'}
            </button>
          </div>
        )}
        
        {/* Create Project */}
        {step === 'project' && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Create Project</h2>
            <form onSubmit={createProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Client</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating Project...' : 'Create Project'}
              </button>
            </form>
          </div>
        )}
        
        {/* User Info */}
        {user && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Signed in as: {user.email}</div>
                <div className="text-sm text-gray-600">User ID: {user.uid}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
        
        {/* Logs */}
        <div className="bg-black rounded-lg p-4 mb-6">
          <h2 className="text-white font-semibold mb-2">Debug Logs</h2>
          <div className="overflow-auto h-64 text-green-400 font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}