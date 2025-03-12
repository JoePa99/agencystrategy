import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function EnvDebugAdvanced() {
  interface EnvInfo {
    nodeEnv?: string;
    nextPublicApiKey?: string;
    nextPublicApiKeyExists?: boolean;
    nextPublicApiKeyLength?: number;
    nextPublicAuthDomain?: string;
    nextPublicProjectId?: string;
    nextPublicStorageBucket?: string;
    nextPublicMessagingSenderId?: string;
    nextPublicAppId?: string;
    nextAuthUrl?: string;
    nextAuthSecret?: string;
    isBrowser?: boolean;
    isDevelopment?: boolean;
    isProduction?: boolean;
  }
  
  const [envInfo, setEnvInfo] = useState<EnvInfo>({});
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [nextConfig, setNextConfig] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Get environment information
    const runtimeEnv = {
      nodeEnv: process.env.NODE_ENV,
      nextPublicApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      nextPublicApiKeyExists: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
      nextPublicApiKeyLength: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.length || 0,
      nextPublicAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      nextPublicProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      nextPublicStorageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      nextPublicMessagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      nextPublicAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? '(set)' : '(not set)',
      isBrowser: typeof window !== 'undefined',
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
    };
    
    // Get all NEXT_PUBLIC environment variables
    const publicEnvVars: Record<string, string> = {};
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        publicEnvVars[key] = process.env[key] || '';
      }
    });
    
    // Get Next.js config env values
    const nextJsConfigEnv = {
      // This is populated from next.config.js env object
      ...(process.env || {})
    };
    
    setEnvInfo(runtimeEnv);
    setEnvVars(publicEnvVars);
    setNextConfig(nextJsConfigEnv);
  }, []);
  
  const handleRefreshValues = () => {
    window.location.reload();
  };
  
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <Head>
        <title>Advanced Environment Variables Debugging</title>
      </Head>
      
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Advanced Environment Variables Debugging</h1>
          <button 
            onClick={handleRefreshValues}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Values
          </button>
        </div>
        
        <div className="grid gap-6">
          {/* Runtime Environment Information */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Runtime Environment Information</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(envInfo).map(([key, value]) => (
                    <tr key={key}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {key}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {typeof value === 'boolean' ? String(value) : (value as string)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* NEXT_PUBLIC Environment Variables */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">NEXT_PUBLIC Environment Variables</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variable
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.keys(envVars).length > 0 ? (
                    Object.entries(envVars).map(([key, value]) => (
                      <tr key={key}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {key}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {value ? `${value.substring(0, 3)}...` : 'Not set'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-500" colSpan={2}>
                        No NEXT_PUBLIC environment variables found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Firebase Config Test */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Firebase Config Test</h2>
            <p className="mb-2 text-sm text-gray-600">Test initializing Firebase with current environment values:</p>
            
            <div className="mt-4">
              <a 
                href="/auth-debug" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to Auth Debug Page
              </a>
            </div>
          </div>
          
          {/* Link to other useful pages */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Useful Links</h2>
            <ul className="space-y-2 text-blue-600">
              <li><a href="/auth-debug" className="hover:underline">/auth-debug</a> - Authentication debugging</li>
              <li><a href="/debug-env" className="hover:underline">/debug-env</a> - Basic environment debug</li>
              <li><a href="/auth/signin" className="hover:underline">/auth/signin</a> - NextAuth signin</li>
              <li><a href="/" className="hover:underline">/</a> - Home page</li>
            </ul>
          </div>
          
          <div className="text-center text-sm text-gray-500 mt-6">
            Environment debugging tool
          </div>
        </div>
      </div>
    </div>
  );
}