import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useNextAuth } from '@/hooks/useNextAuth';

export default function DebugEnv() {
  const { data: session, status } = useSession();
  const { userProfile, loading, error } = useNextAuth();
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    // Gather environment variables
    setEnvVars({
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      ENV_LOADED: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
      NODE_ENV: process.env.NODE_ENV,
    });
  }, []);

  return (
    <div className="min-h-screen p-8">
      <Head>
        <title>Environment Variables Debug</title>
      </Head>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Environment Variables Debug</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Auth Status</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Session Status:</strong> {status}</p>
            <p><strong>User Email:</strong> {session?.user?.email || 'Not logged in'}</p>
            <p><strong>User ID:</strong> {session?.user?.id || 'Not available'}</p>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">User Profile from useNextAuth</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
            {userProfile ? (
              <div className="mt-3">
                <p><strong>Name:</strong> {userProfile.displayName}</p>
                <p><strong>Email:</strong> {userProfile.email}</p>
                <p><strong>Role:</strong> {userProfile.role}</p>
                <p><strong>Organization ID:</strong> {userProfile.organizationId || 'None'}</p>
                <div className="mt-2">
                  <details>
                    <summary className="cursor-pointer text-blue-600">View Full Profile</summary>
                    <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(userProfile, null, 2)}</pre>
                  </details>
                </div>
              </div>
            ) : (
              <p className="text-red-500 mt-2">User profile not loaded</p>
            )}
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
          <div className="bg-gray-100 p-4 rounded overflow-x-auto">
            <pre className="text-sm">{JSON.stringify(envVars, null, 2)}</pre>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">URLs</h2>
          <ul className="space-y-2">
            <li>
              <a href="/next-dashboard" className="text-blue-600 hover:underline">
                Next Dashboard
              </a>
            </li>
            <li>
              <a href="/next-project/new" className="text-blue-600 hover:underline">
                New Project
              </a>
            </li>
            <li>
              <a href="/dashboard" className="text-blue-600 hover:underline">
                Old Dashboard
              </a>
            </li>
            <li>
              <a href="/auth/signin" className="text-blue-600 hover:underline">
                Sign In
              </a>
            </li>
            <li>
              <a href="/auth/signout" className="text-blue-600 hover:underline">
                Sign Out
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}