'use client';

import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function FirebaseQuickTest() {
  const [status, setStatus] = useState('Initializing...');
  const [configCheck, setConfigCheck] = useState<any>(null);

  useEffect(() => {
    // Check Firebase configuration
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    
    setConfigCheck(config);
    
    // Test if Firebase is properly initialized
    if (auth && auth.app) {
      setStatus('✅ Firebase initialized successfully');
    } else {
      setStatus('❌ Firebase initialization failed');
    }
  }, []);

  const testRegistration = async () => {
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'password123';
    
    try {
      setStatus('Testing user registration...');
      
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      setStatus(`✅ SUCCESS! User created: ${userCredential.user.uid}`);
      
      // Clean up test user
      await userCredential.user.delete();
      setStatus(prev => prev + '\n🧹 Test user deleted');
      
    } catch (error: any) {
      console.error('Registration test failed:', error);
      
      if (error.code === 'auth/configuration-not-found') {
        setStatus(`❌ ERROR: ${error.code}\n\n🔧 SOLUTION: Enable Authentication in Firebase Console:\n1. Go to https://console.firebase.google.com/project/mini-project-1-2ad92\n2. Click Authentication > Get started\n3. Enable Email/Password sign-in method`);
      } else {
        setStatus(`❌ ERROR: ${error.code}\n${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🔥 Firebase Setup Test</h1>
        
        {/* Configuration Check */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📋 Configuration Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Project ID:</strong> {configCheck?.projectId || 'Not set'}
            </div>
            <div>
              <strong>Auth Domain:</strong> {configCheck?.authDomain || 'Not set'}
            </div>
            <div>
              <strong>API Key:</strong> {configCheck?.apiKey ? '✅ Set' : '❌ Missing'}
            </div>
            <div>
              <strong>App ID:</strong> {configCheck?.appId ? '✅ Set' : '❌ Missing'}
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔍 Current Status</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap">{status}</pre>
        </div>

        {/* Test Button */}
        <div className="text-center">
          <button
            onClick={testRegistration}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg"
          >
            🚀 Test Firebase Authentication
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mt-8">
          <h3 className="text-lg font-semibold mb-2">📝 Setup Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to <strong>Firebase Console</strong>: https://console.firebase.google.com/project/mini-project-1-2ad92</li>
            <li>Click <strong>"Authentication"</strong> in the left sidebar</li>
            <li>Click <strong>"Get started"</strong> if you see it</li>
            <li>Go to <strong>"Sign-in method"</strong> tab</li>
            <li>Enable <strong>"Email/Password"</strong> sign-in method</li>
            <li>Come back and test again!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}