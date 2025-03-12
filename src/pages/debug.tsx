// src/pages/debug.tsx
import { useState, useEffect } from 'react';
import { auth } from '@/firebase/config';

export default function DebugPage() {
  const [firebaseStatus, setFirebaseStatus] = useState<string>('Checking...');
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Check Firebase initialization
    if (typeof window !== 'undefined') {
      try {
        // Check if auth is initialized
        if (auth) {
          setFirebaseStatus('Firebase initialized successfully');
        } else {
          setFirebaseStatus('Firebase auth not initialized');
        }
        
        // Get environment variables
        const vars: Record<string, string> = {};
        
        // Check for environment variables
        vars['NEXT_PUBLIC_FIREBASE_API_KEY'] = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set (hidden)' : 'Not set';
        vars['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'] = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Not set';
        vars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set';
        vars['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'] = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'Not set';
        vars['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'] = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'Not set';
        vars['NEXT_PUBLIC_FIREBASE_APP_ID'] = process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'Set (hidden)' : 'Not set';
        
        setEnvVars(vars);
      } catch (error) {
        setFirebaseStatus(`Firebase initialization error: ${(error as Error).message}`);
      }
    }
  }, []);
  
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-4">Firebase Debug Page</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium mb-4">Firebase Status</h2>
          <div className={`p-3 rounded-md ${
            firebaseStatus.includes('successfully') 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            {firebaseStatus}
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium mb-4">Environment Variables</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variable</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(envVars).map(([key, value]) => (
                  <tr key={key}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{key}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}