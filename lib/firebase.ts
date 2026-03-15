import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Debug configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Config Status:', {
    apiKey: firebaseConfig.apiKey ? '✓ Set' : '✗ Missing',
    authDomain: firebaseConfig.authDomain ? '✓ Set' : '✗ Missing',
    projectId: firebaseConfig.projectId ? '✓ Set' : '✗ Missing',
    storageBucket: firebaseConfig.storageBucket ? '✓ Set' : '✗ Missing',
    messagingSenderId: firebaseConfig.messagingSenderId ? '✓ Set' : '✗ Missing',
    appId: firebaseConfig.appId ? '✓ Set' : '✗ Missing',
  });
}

// Validate configuration
const requiredEnvVars = [
  { key: 'NEXT_PUBLIC_FIREBASE_API_KEY', value: firebaseConfig.apiKey },
  { key: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', value: firebaseConfig.authDomain },
  { key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', value: firebaseConfig.projectId },
  { key: 'NEXT_PUBLIC_FIREBASE_APP_ID', value: firebaseConfig.appId },
];

const missingVars = requiredEnvVars.filter(env => !env.value);

if (missingVars.length > 0) {
  const missing = missingVars.map(env => env.key).join(', ');
  console.error('Missing Firebase environment variables:', missing);
  throw new Error(`Missing required Firebase environment variables: ${missing}`);
}

// Initialize Firebase
let app: FirebaseApp;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  console.log('Firebase app initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  throw error;
}

// Initialize Firebase Auth
let auth: Auth;
try {
  auth = getAuth(app);
  console.log('Firebase Auth initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Auth:', error);
  throw error;
}

// Helper to check if Firebase is initialized
export const isFirebaseInitialized = () => getApps().length > 0;

export { app, auth };

