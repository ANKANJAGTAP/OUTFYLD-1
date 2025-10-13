'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function FirebaseAuthTest() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState('');

  const testFirebaseAuth = async () => {
    try {
      setResult('Testing Firebase Auth...');
      
      // Test if auth is working
      console.log('Auth object:', auth);
      console.log('Auth app:', auth.app);
      console.log('Auth config:', auth.config);

      // Try to create a test user (this will fail if auth is not configured)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setResult(`✅ SUCCESS: User created with UID: ${userCredential.user.uid}`);
      
      // Clean up - delete the test user
      await userCredential.user.delete();
      setResult(prev => prev + '\n🧹 Test user cleaned up');
      
    } catch (error: any) {
      console.error('Firebase auth test error:', error);
      setResult(`❌ ERROR: ${error.code} - ${error.message}`);
      
      if (error.code === 'auth/configuration-not-found') {
        setResult(prev => prev + '\n\n🔧 SOLUTION: Enable Authentication in Firebase Console');
      } else if (error.code === 'auth/email-already-in-use') {
        setResult(prev => prev + '\n\n✅ Firebase Auth is working! (Email already exists)');
      }
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Firebase Authentication Test</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block mb-2">Test Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block mb-2">Test Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <button
          onClick={testFirebaseAuth}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Firebase Auth
        </button>
        
        {result && (
          <div className="bg-gray-100 p-4 rounded mt-4">
            <h3 className="font-semibold mb-2">Test Result:</h3>
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}
        
        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Environment Status:</h3>
          <ul className="text-sm">
            <li>API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</li>
            <li>Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing'}</li>
            <li>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'}</li>
            <li>App ID: {process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}