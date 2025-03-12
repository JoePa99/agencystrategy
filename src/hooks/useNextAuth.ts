import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Define the user profile type
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'strategist' | 'client' | 'creative';
  organizationId?: string;
  createdAt: any;
  lastLoginAt: any;
}

export function useNextAuth() {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Firebase configuration from environment variables
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  useEffect(() => {
    // If not authenticated or still loading, do nothing yet
    if (status === 'loading') {
      return;
    }
    
    if (status === 'unauthenticated') {
      setUserProfile(null);
      setLoading(false);
      return;
    }
    
    if (session?.user?.id) {
      fetchUserProfile(session.user.id);
    } else {
      setLoading(false);
      setError('User ID not found in session');
    }
  }, [session, status]);
  
  // Function to fetch user profile from Firestore
  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      
      // Initialize Firebase
      const app = initializeApp(firebaseConfig, 'useNextAuth');
      const db = getFirestore(app);
      
      // Get user profile
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        setUserProfile(profileData);
        setError(null);
      } else {
        setUserProfile(null);
        setError('User profile not found in database');
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err.message || 'Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to manually refresh the profile
  const refreshUserProfile = async () => {
    if (session?.user?.id) {
      await fetchUserProfile(session.user.id);
    }
  };
  
  // Login function (redirects to sign in page)
  const login = () => signIn(undefined, { callbackUrl: '/dashboard' });
  
  // Logout function
  const logout = () => signOut({ callbackUrl: '/' });
  
  return {
    session,
    status,
    userProfile,
    loading,
    error,
    refreshUserProfile,
    login,
    logout
  };
}