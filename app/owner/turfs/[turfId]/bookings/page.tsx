'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import BookingManager from '@/components/owner/BookingManager';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, ArrowLeft, LogOut } from 'lucide-react';
import Link from 'next/link';

function TurfBookingsPage() {
  const { user, firebaseUser, logout } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const turfId = params.turfId as string;
  const [turfName, setTurfName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTurfDetails = async () => {
      if (!firebaseUser || !turfId) return;
      
      setLoading(true);
      try {
        const idToken = await firebaseUser.getIdToken();
        const response = await fetch(`/api/turfs/owner/${turfId}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTurfName(data.turf?.name || data.turf?.contactInfo?.businessName || 'Turf');
        }
      } catch (error) {
        console.error('Error fetching turf details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTurfDetails();
  }, [firebaseUser, turfId]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/owner/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center">
                <Building className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {loading ? 'Loading...' : turfName}
                  </h1>
                  <p className="text-xs text-gray-500">Booking Management</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Owner
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={logout}
                className="text-gray-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!loading && (
          <BookingManager 
            ownerId={user.uid} 
            turfId={turfId}
            turfName={turfName}
          />
        )}
      </main>
    </div>
  );
}

export default function TurfBookingsPageWrapper() {
  return (
    <ProtectedRoute requireRole="owner">
      <TurfBookingsPage />
    </ProtectedRoute>
  );
}
