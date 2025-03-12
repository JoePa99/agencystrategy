// src/firebase/auth.ts
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  updateProfile,
  User,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// Types
export type UserRole = 'admin' | 'strategist' | 'client' | 'creative';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  organizationId?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

// Sign up new user
export const signUp = async (
  email: string, 
  password: string, 
  displayName: string,
  role: UserRole = 'strategist',
  organizationId?: string
): Promise<UserCredential> => {
  // Create the user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Update the user's profile
  await updateProfile(user, { displayName });
  
  // Create the user document in Firestore
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName,
    role,
    // Only include organizationId if it's defined
    ...(organizationId ? { organizationId } : {}),
    createdAt: new Date(),
    lastLoginAt: new Date()
  };
  
  await setDoc(doc(db, 'users', user.uid), {
    ...userProfile,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp()
  });
  
  return userCredential;
};

// Sign in existing user
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Update last login time
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    lastLoginAt: serverTimestamp()
  }, { merge: true });
  
  return userCredential;
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;
  
  // Check if user document exists
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  
  if (!userDoc.exists()) {
    // First time sign in - create user profile
    const userProfile: Partial<UserProfile> = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || undefined,
      role: 'strategist', // Default role
      createdAt: new Date(),
      lastLoginAt: new Date()
      // Note: organizationId will be set during onboarding
    };
    
    await setDoc(doc(db, 'users', user.uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
  } else {
    // Update last login time
    await setDoc(doc(db, 'users', user.uid), {
      lastLoginAt: serverTimestamp()
    }, { merge: true });
  }
  
  return userCredential;
};

// Sign out
export const signOut = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

// Get current user profile
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) return null;
  
  return userDoc.data() as UserProfile;
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email);
};

// Update user password
export const updateUserPassword = async (user: User, newPassword: string): Promise<void> => {
  return updatePassword(user, newPassword);
};

// Update user email
export const updateUserEmail = async (user: User, newEmail: string): Promise<void> => {
  return updateEmail(user, newEmail);
};

// Update user profile information
export const updateUserProfile = async (
  uid: string, 
  profileData: Partial<UserProfile>
): Promise<void> => {
  const user = auth.currentUser;
  if (!user || user.uid !== uid) throw new Error('Unauthorized');
  
  // Update in Firestore
  await setDoc(doc(db, 'users', uid), profileData, { merge: true });
  
  // Update in Authentication
  if (profileData.displayName || profileData.photoURL) {
    await updateProfile(user, {
      displayName: profileData.displayName || user.displayName,
      photoURL: profileData.photoURL || user.photoURL
    });
  }
};