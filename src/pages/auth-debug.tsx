import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession, signIn } from 'next-auth/react';
import { useNextAuth } from '@/hooks/useNextAuth';

export default function AuthDebug() {
  const { data: session, status } = useSession();
  const nextAuth = useNextAuth();
  const [localAuth, setLocalAuth] = useState<any>(null);
  
  useEffect(() => {
    // Get auth from localStorage
    try {
      const authStr = localStorage.getItem('firebase-auth-state');
      if (authStr) {
        const auth = JSON.parse(authStr);
        setLocalAuth(auth);
      }
    } catch (err) {
      console.error('Error accessing localStorage:', err);
    }
  }, []);
  
  const handleForceLogin = () => {
    signIn(undefined, { callbackUrl: '/next-dashboard' });
  };
  
  return (
    <div className="min-h-screen p-8">
      <Head>
        <title>Auth Debugging Tool</title>
      </Head>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Auth Debugging Tool</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">NextAuth Session</h2>
            <div className="space-y-2">
              <p><strong>Status:</strong> {status}</p>
              <p><strong>Email:</strong> {session?.user?.email || 'Not logged in'}</p>
              <p><strong>User ID:</strong> {session?.user?.id || 'Not available'}</p>
              
              <div className="mt-4">
                <details>
                  <summary className="cursor-pointer text-blue-600">View Raw Session Data</summary>
                  <pre className="mt-2 text-xs overflow-auto p-2 bg-gray-100 rounded">{JSON.stringify(session, null, 2)}</pre>
                </details>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={handleForceLogin}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Force Sign In
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">useNextAuth Hook</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {nextAuth.loading ? 'Yes' : 'No'}</p>
              <p><strong>Error:</strong> {nextAuth.error || 'None'}</p>
              <p><strong>Has Profile:</strong> {nextAuth.userProfile ? 'Yes' : 'No'}</p>
              {nextAuth.userProfile && (
                <>
                  <p><strong>Display Name:</strong> {nextAuth.userProfile.displayName}</p>
                  <p><strong>Organization ID:</strong> {nextAuth.userProfile.organizationId || 'None'}</p>
                </>
              )}
              
              <div className="mt-4">
                <details>
                  <summary className="cursor-pointer text-blue-600">View User Profile Data</summary>
                  <pre className="mt-2 text-xs overflow-auto p-2 bg-gray-100 rounded">{JSON.stringify(nextAuth.userProfile, null, 2)}</pre>
                </details>
              </div>
              
              {nextAuth.refreshUserProfile && (
                <div className="mt-4">
                  <button
                    onClick={nextAuth.refreshUserProfile}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Refresh Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Local Storage Auth State</h2>
          {localAuth ? (
            <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">{JSON.stringify(localAuth, null, 2)}</pre>
          ) : (
            <p>No firebase-auth-state found in localStorage</p>
          )}
        </div>
        
        <div className="mt-8 bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2">
            <p><strong>NEXT_PUBLIC_FIREBASE_API_KEY:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'Not set'}</p>
            <p><strong>API Key Length:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.length || 0}</p>
            <p><strong>API Key Starts With:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 3)}...</p>
            <p><strong>NEXT_PUBLIC_FIREBASE_PROJECT_ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}</p>
            <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
          </div>
        </div>
        
        <div className="mt-8 bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Links</h2>
          <div className="space-y-2">
            <p><a href="/auth/signin" className="text-blue-600 hover:underline">/auth/signin</a> - NextAuth sign in page</p>
            <p><a href="/next-dashboard" className="text-blue-600 hover:underline">/next-dashboard</a> - New dashboard using NextAuth</p>
            <p><a href="/next-project-simple" className="text-blue-600 hover:underline">/next-project-simple</a> - Simplified project creation</p>
            <p><a href="/debug-env" className="text-blue-600 hover:underline">/debug-env</a> - Environment debug page</p>
          </div>
        </div>
      </div>
    </div>
  );
}