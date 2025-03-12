// src/pages/env-test.tsx
import { useState, useEffect } from 'react';

export default function EnvTestPage() {
  const [envVars, setEnvVars] = useState<Record<string, string | undefined>>({});
  
  useEffect(() => {
    // Gather all environment variables with NEXT_PUBLIC prefix
    const vars: Record<string, string | undefined> = {};
    
    // Firebase variables
    vars['FIREBASE_API_KEY'] = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    vars['FIREBASE_AUTH_DOMAIN'] = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    vars['FIREBASE_PROJECT_ID'] = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    vars['FIREBASE_STORAGE_BUCKET'] = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    vars['FIREBASE_MESSAGING_SENDER_ID'] = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
    vars['FIREBASE_APP_ID'] = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
    vars['FIREBASE_MEASUREMENT_ID'] = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
    
    // Other variables (without showing full values)
    vars['OPENAI_API_KEY_SET'] = process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'Yes' : 'No';
    vars['PINECONE_API_KEY_SET'] = process.env.NEXT_PUBLIC_PINECONE_API_KEY ? 'Yes' : 'No';
    vars['PINECONE_INDEX_SET'] = process.env.NEXT_PUBLIC_PINECONE_INDEX ? 'Yes' : 'No';
    
    setEnvVars(vars);
  }, []);
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium mb-4">Firebase Configuration</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variable</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value (First 10 chars)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(envVars).map(([key, value]) => (
                  <tr key={key}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{key}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.includes('_SET') 
                        ? value 
                        : value 
                          ? `${value.substring(0, 10)}...` 
                          : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {value ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Set
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Missing
                        </span>
                      )}
                    </td>
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