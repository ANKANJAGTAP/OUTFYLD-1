// Simple Firebase configuration test
// Run this with: node test-firebase-config.js

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log('🔥 Firebase Configuration Test');
console.log('================================');

Object.entries(config).forEach(([key, value]) => {
  const status = value ? '✅ SET' : '❌ MISSING';
  console.log(`${key}: ${status}`);
  if (value) {
    console.log(`   Value: ${value.substring(0, 20)}...`);
  }
});

if (Object.values(config).every(v => v)) {
  console.log('\n✅ All Firebase configuration values are set!');
} else {
  console.log('\n❌ Some Firebase configuration values are missing!');
}