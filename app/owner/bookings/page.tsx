'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Building, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import BookingManager from '@/components/owner/BookingManager';

function TurfOwnerBookings() {
  const { user, logout } = useAuth();
  const searchParams = useSearchParams();
  const turfId = searchParams.get('turfId') || undefined;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href="/owner/dashboard">
                <Button variant="ghost" size="sm">
                  ← Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center">
                <Building className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Booking History
                  </h1>
                  <p className="text-sm text-gray-500">
                    View and manage all bookings for this facility
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Owner
                </Badge>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookingManager 
          ownerId={user?.uid || ''} 
          turfId={turfId}
        />
      </div>
    </div>
  );
}

// Page wrapper for badge import and protection
import { Badge } from '@/components/ui/badge';

export default function BookingsPage() {
  return (
    <ProtectedRoute requireRole="owner">
      <TurfOwnerBookings />
    </ProtectedRoute>
  );
}
