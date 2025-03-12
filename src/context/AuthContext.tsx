// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import type { User } from '@firebase/auth-types';
import { auth, db } from '@/firebase/config';
import { getCurrentUserProfile, UserProfile } from '@/firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  error: null,
  refreshUserProfile: async () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch the user profile directly from Firestore
  const fetchUserProfileDirectly = async (uid: string): Promise<UserProfile | null> => {
    try {
      console.log('Fetching user profile directly from Firestore for UID:', uid);
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        console.log('User profile found in Firestore:', userDoc.data());
        const data = userDoc.data();
        return data as UserProfile;
      } else {
        console.log('User profile not found in Firestore');
        return null;
      }
    } catch (err) {
      console.error('Error fetching user profile directly:', err);
      return null;
    }
  };

  // Function to refresh the user profile
  const refreshUserProfile = async () => {
    if (!auth.currentUser) {
      console.log('Cannot refresh profile: No user is signed in');
      return;
    }
    
    try {
      console.log('Refreshing user profile...');
      setLoading(true);
      
      // Try both methods
      const profile = await getCurrentUserProfile();
      
      if (profile && profile.organizationId) {
        console.log('Profile loaded with getCurrentUserProfile:', profile);
        setUserProfile(profile);
      } else {
        console.log('getCurrentUserProfile returned null or missing organizationId, trying direct fetch');
        const directProfile = await fetchUserProfileDirectly(auth.currentUser.uid);
        if (directProfile) {
          console.log('Profile loaded directly from Firestore:', directProfile);
          setUserProfile(directProfile);
        } else {
          console.error('Failed to load user profile from both methods');
          setError('Failed to load user profile data');
        }
      }
    } catch (err) {
      console.error('Error refreshing user profile:', err);
      setError('Failed to refresh user profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Skip auth on server side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    
    // Check if auth is available (client-side only)
    if (!auth) {
      console.error('Firebase Auth is not initialized');
      setError('Authentication service is not available');
      setLoading(false);
      return;
    }
    
    console.log('Setting up auth state listener in AuthContext');
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User signed in: ${user.email}` : 'User signed out');
      setUser(user as unknown as User);
      
      try {
        if (user) {
          // Try both methods to get user profile
          const profile = await getCurrentUserProfile();
          
          if (profile && profile.organizationId) {
            console.log('Profile loaded with getCurrentUserProfile:', profile);
            setUserProfile(profile);
          } else {
            console.log('getCurrentUserProfile returned null or missing organizationId, trying direct fetch');
            const directProfile = await fetchUserProfileDirectly(user.uid);
            if (directProfile) {
              console.log('Profile loaded directly from Firestore:', directProfile);
              setUserProfile(directProfile);
            } else {
              console.error('Failed to load user profile from both methods');
              setError('Failed to load user profile data');
            }
          }
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile data');
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe && unsubscribe();
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    error,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};