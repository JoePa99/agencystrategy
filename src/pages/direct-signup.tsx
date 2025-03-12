// pages/direct-signup.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Import types only
import { UserRole } from '@/firebase/auth';

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationName: string;
  role: UserRole;
}

export default function DirectSignup() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState('Initializing Firebase...');
  const router = useRouter();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupFormData>({
    defaultValues: {
      role: 'admin'
    }
  });
  
  const password = watch('password');
  
  // Initialize Firebase directly
  const firebaseConfig = {
    apiKey: "AIzaSyA0trAXY9TnPYkkDtZ2tK0DAYYWeZf2kPI",
    authDomain: "agencystrategy-95d3d.firebaseapp.com",
    projectId: "agencystrategy-95d3d",
    storageBucket: "agencystrategy-95d3d.appspot.com",
    messagingSenderId: "1090868022098",
    appId: "1:1090868022098:web:2dc833c626358be49e088b"
  };
  
  // Initialize Firebase app and services directly
  const app = initializeApp(firebaseConfig, 'directSignupApp');
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      setAuthStatus('Creating your account...');
      
      // Create user account using the auth instance from this component
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );
      
      const user = userCredential.user;
      
      // Update the user's profile
      await updateProfile(user, { displayName: data.name });
      
      setAuthStatus('Creating organization...');
      
      // Create organization directly using Firestore
      const orgRef = doc(db, 'organizations', 'org_' + Date.now());
      await setDoc(orgRef, {
        name: data.organizationName,
        logoUrl: undefined,
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
      
      const orgId = orgRef.id;
      
      setAuthStatus('Setting up your organization...');
      
      // Add user as organization member
      await setDoc(doc(db, 'organizations', orgId, 'members', user.uid), {
        displayName: data.name,
        email: data.email,
        role: data.role,
        photoURL: user.photoURL || undefined,
        joinedAt: serverTimestamp()
      });
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email || data.email,
        displayName: data.name,
        role: data.role,
        organizationId: orgId,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
      
      setAuthStatus('Account created successfully! Redirecting...');
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Provide more user-friendly error messages
      let errorMessage = 'Failed to create account';
      
      if (err.code === 'auth/api-key-not-valid') {
        errorMessage = 'Firebase authentication is not properly configured. Please try again later or contact support.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use. Please try logging in instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'The email address is not valid.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak. Please choose a stronger password.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setAuthStatus('Account creation failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    
    try {
      setAuthStatus('Starting Google sign up...');
      
      // Use the auth instance created in this component
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      setAuthStatus('Google sign up successful! You will now be redirected to complete your profile.');
      
      // For Google signup, redirect to onboarding page to complete profile
      router.push('/onboarding');
    } catch (err: any) {
      console.error('Google sign up error:', err);
      
      // Provide more user-friendly error messages
      let errorMessage = 'Failed to sign up with Google';
      
      if (err.code === 'auth/api-key-not-valid') {
        errorMessage = 'Firebase authentication is not properly configured. Please try again later or contact support.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'The Google sign-in popup was closed. Please try again.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'The Google sign-in popup was blocked by your browser. Please enable popups for this site and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setAuthStatus('Google sign up failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-neutral-900">
          Create your account (Direct Method)
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          This page uses direct Firebase initialization to bypass potential environment issues
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="mb-4 rounded-md bg-blue-50 p-4">
            <div className="text-sm text-blue-700">{authStatus}</div>
          </div>
          
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium leading-6 text-neutral-900">
                Full name
              </label>
              <div className="mt-2">
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className="input-field"
                  {...register('name', { 
                    required: 'Name is required'
                  })}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-neutral-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input-field"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: 'Please enter a valid email'
                    }
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-neutral-900">
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="input-field"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-neutral-900">
                Confirm password
              </label>
              <div className="mt-2">
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="input-field"
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium leading-6 text-neutral-900">
                Organization name
              </label>
              <div className="mt-2">
                <input
                  id="organizationName"
                  type="text"
                  className="input-field"
                  {...register('organizationName', { 
                    required: 'Organization name is required'
                  })}
                />
                {errors.organizationName && (
                  <p className="mt-1 text-sm text-red-600">{errors.organizationName.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium leading-6 text-neutral-900">
                Your role
              </label>
              <div className="mt-2">
                <select
                  id="role"
                  className="input-field"
                  {...register('role')}
                >
                  <option value="admin">Administrator</option>
                  <option value="strategist">Strategist</option>
                  <option value="creative">Creative</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-neutral-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 focus-visible:outline-offset-0 disabled:opacity-50"
              >
                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 24C15.2404 24 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24 12.0004 24Z"
                    fill="#34A853"
                  />
                </svg>
                Google
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm text-neutral-500">
            <p>
              <Link href="/signup" className="font-semibold text-primary-600 hover:text-primary-500">
                Go back to regular signup
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}