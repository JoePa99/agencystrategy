import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function SignOut() {
  const router = useRouter();
  
  useEffect(() => {
    // Perform the sign out operation automatically when the page loads
    const performSignOut = async () => {
      try {
        await signOut({ redirect: false });
        // Redirect to home page after sign out
        router.push('/');
      } catch (error) {
        console.error('Error signing out:', error);
        // Redirect home even if there's an error
        router.push('/');
      }
    };
    
    performSignOut();
  }, [router]);
  
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <Head>
        <title>Signing Out - Agency Strategy</title>
      </Head>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Signing out</h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please wait while we sign you out...
        </p>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="flex justify-center">
            <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}