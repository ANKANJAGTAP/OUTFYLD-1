'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';

export default function FirebaseTestPage() {
  const [configStatus, setConfigStatus] = useState<any>(null);

  useEffect(() => {
    // Test Firebase configuration
    const testConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'MISSING',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'MISSING',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'MISSING',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'MISSING',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'MISSING',
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'MISSING',
    };

    console.log('Firebase Config Test:', testConfig);
    console.log('Auth object:', auth);
    console.log('Auth app:', auth?.app);
    
    setConfigStatus(testConfig);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Firebase Configuration Test</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Environment Variables:</h2>
        <pre className="text-sm">
          {JSON.stringify(configStatus, null, 2)}
        </pre>
      </div>

      <div className="mt-4 bg-blue-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Auth Status:</h2>
        <p>Auth object exists: {auth ? 'Yes' : 'No'}</p>
        <p>Auth app exists: {auth?.app ? 'Yes' : 'No'}</p>
        <p>Auth app name: {auth?.app?.name || 'N/A'}</p>
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-600">
          Check the browser console for detailed logs.
        </p>
      </div>
    </div>
  );
}