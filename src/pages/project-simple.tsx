// src/pages/project-simple.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';

interface FormValues {
  name: string;
  description: string;
  client: string;
}

export default function ProjectSimple() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  
  const { register, handleSubmit } = useForm<FormValues>();
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };
  
  const firebaseConfig = {
    apiKey: "AIzaSyA0trAXY9TnPYkkDtZ2tK0DAYYWeZf2kPI",
    authDomain: "agencystrategy-95d3d.firebaseapp.com",
    projectId: "agencystrategy-95d3d",
    storageBucket: "agencystrategy-95d3d.appspot.com",
    messagingSenderId: "1090868022098",
    appId: "1:1090868022098:web:2dc833c626358be49e088b"
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      addLog(`Attempting to sign in with email: ${email}`);
      
      // Initialize Firebase
      const app = initializeApp(firebaseConfig, 'projectSimple');
      const auth = getAuth(app);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      addLog(`Signed in as: ${user.email} (${user.uid})`);
      setIsLoggedIn(true);
      setUserId(user.uid);
      
      // Get user profile immediately
      const db = getFirestore(app);
      const userDocRef = doc(db, 'users', user.uid);
      const userData = await userDocRef.get();
      
      if (userData.exists()) {
        addLog(`User profile data: ${JSON.stringify(userData.data())}`);
      } else {
        addLog('No user profile found, creating one with organization');
        
        // Create organization
        const orgId = `org_${Date.now()}`;
        await setDoc(doc(db, 'organizations', orgId), {
          name: 'Default Organization',
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
        
        // Create user profile
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'New User',
          role: 'admin',
          organizationId: orgId,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });
        
        addLog('Created user profile with organization ID');
      }
    } catch (error: any) {
      addLog(`Sign in error: ${error.message}`);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    if (!isLoggedIn || !userId) {
      setError('You must be logged in to create a project');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      addLog('Creating project...');
      
      const app = initializeApp(firebaseConfig, 'projectSimple');
      const db = getFirestore(app);
      
      // Get user profile
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const userData = userDoc.data();
      const organizationId = userData.organizationId;
      
      if (!organizationId) {
        throw new Error('No organization ID found in user profile');
      }
      
      addLog(`Using organization ID: ${organizationId}`);
      
      // Create project
      const projectsRef = collection(db, 'projects');
      const newProjectRef = doc(projectsRef);
      
      await setDoc(newProjectRef, {
        name: data.name,
        description: data.description,
        client: data.client,
        organizationId: organizationId,
        createdBy: userId,
        status: 'active',
        members: {
          [userId]: 'owner'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const projectId = newProjectRef.id;
      addLog(`Project created successfully with ID: ${projectId}`);
      
      // Redirect to the project
      router.push(`/projects/${projectId}`);
    } catch (error: any) {
      addLog(`Error creating project: ${error.message}`);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Simple Project Creator</h1>
      
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      {!isLoggedIn ? (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
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
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Project name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="name"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  {...register('name', { required: true })}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700">
                Client
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="client"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  {...register('client', { required: true })}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Project description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  {...register('description', { required: true })}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create project'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}