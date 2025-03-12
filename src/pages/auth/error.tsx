import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AuthError() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>('An authentication error occurred');
  
  useEffect(() => {
    const { error } = router.query;
    
    if (error) {
      // Handle different error types
      switch (error) {
        case 'CredentialsSignin':
          setErrorMessage('Sign in failed. Please check your email and password.');
          break;
        case 'OAuthSignin':
          setErrorMessage('Error starting the OAuth sign in process.');
          break;
        case 'OAuthCallback':
          setErrorMessage('Error during the OAuth callback.');
          break;
        case 'OAuthCreateAccount':
          setErrorMessage('Could not create OAuth account.');
          break;
        case 'EmailCreateAccount':
          setErrorMessage('Could not create email account.');
          break;
        case 'Callback':
          setErrorMessage('Error during the callback process.');
          break;
        case 'Configuration':
          setErrorMessage('There is a problem with the server configuration.');
          break;
        case 'AccessDenied':
          setErrorMessage('Access denied. You do not have permission to sign in.');
          break;
        default:
          setErrorMessage(Array.isArray(error) ? error[0] : (error as string));
      }
    }
  }, [router.query]);
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-6 rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-2xl font-bold text-red-600">Authentication Error</h2>
          <p className="mt-2 text-center text-gray-600">
            {errorMessage}
          </p>
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <Link 
            href="/auth/signin"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Sign In
          </Link>
          
          <Link 
            href="/"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}