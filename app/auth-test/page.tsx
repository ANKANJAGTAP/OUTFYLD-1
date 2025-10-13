'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function AuthTest() {
  const { firebaseUser, user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Authentication Debug</h1>
      
      <h2>Firebase User:</h2>
      <pre>{JSON.stringify({
        uid: firebaseUser?.uid,
        email: firebaseUser?.email,
        emailVerified: firebaseUser?.emailVerified,
        exists: !!firebaseUser
      }, null, 2)}</pre>
      
      <h2>MongoDB User:</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      
      {firebaseUser && (
        <div>
          <h2>Test API Call:</h2>
          <button onClick={async () => {
            try {
              const token = await firebaseUser.getIdToken();
              console.log('Token preview:', token.substring(0, 50) + '...');
              
              const response = await fetch('/api/owner/update', {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              const data = await response.json();
              console.log('API Response:', data);
              alert(JSON.stringify(data, null, 2));
            } catch (error: any) {
              console.error('Error:', error);
              alert('Error: ' + (error?.message || 'Unknown error'));
            }
          }}>
            Test API Call
          </button>
        </div>
      )}
    </div>
  );
}