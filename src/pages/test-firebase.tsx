// Test page for Firebase auth imports
import React from 'react';
import * as firebaseAuth from 'firebase/auth';

const TestFirebase = () => {
  console.log('Firebase auth exports:', Object.keys(firebaseAuth));
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Firebase Auth Test</h1>
      <p>Check console for Firebase auth exports</p>
      <pre className="bg-gray-100 p-4 rounded mt-4">
        {JSON.stringify(Object.keys(firebaseAuth), null, 2)}
      </pre>
    </div>
  );
};

export default TestFirebase;