'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function CreateUser() {
  const { firebaseUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createUser = async () => {
    if (!firebaseUser) {
      alert('Please log in first');
      return;
    }

    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: firebaseUser.displayName || 'Turf Owner',
          role: 'owner', // Specifically request owner role
          phone: '',
          businessName: ''
        }),
      });
      
      const data = await response.json();
      setResult(data);
      
      if (response.ok) {
        alert('User created successfully! You can now use the owner dashboard.');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!firebaseUser) {
    return <div>Please log in first</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Create User Record</h1>
      
      <h2>Current Firebase User:</h2>
      <pre>{JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        emailVerified: firebaseUser.emailVerified
      }, null, 2)}</pre>
      
      <button 
        onClick={createUser} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {loading ? 'Creating...' : 'Create User Record in MongoDB'}
      </button>
      
      {result && (
        <div>
          <h2>Result:</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}