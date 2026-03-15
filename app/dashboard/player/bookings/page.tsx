'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { useState, useEffect } from 'react';

function PlayerBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/bookings/customer/${user.uid}?limit=50`);
        if (response.ok) {
          const data = await response.json();
          setBookings(data.bookings || []);
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  if (!user) return null;

  // Format real data for display
  const recentBookings = bookings.map(booking => ({
    id: booking._id,
    turfId: booking.turfId?._id,
    turfName: booking.turfId?.name || booking.turfId?.businessName || booking.turfId?.contactInfo?.businessName || 'Unknown Turf',
    location: booking.turfId?.location?.address || booking.turfId?.location?.city || 'Location unavailable',
    date: booking.slot?.date,
    time: `${booking.slot?.startTime} - ${booking.slot?.endTime}`,
    status: booking.status === 'confirmed' && new Date(booking.slot?.date) < new Date() ? 'completed' : 
            booking.status === 'pending_payment' ? 'pending' : booking.status,
    sport: 'Sports' // Default or fetch from turf details if available
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard/player">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border hover:bg-green-50">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <History className="h-6 w-6 text-green-600" />
              Booking History
            </h1>
            <p className="text-sm text-gray-500">Track all your past and upcoming turf reservations</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>My Bookings</CardTitle>
            <CardDescription>{recentBookings.length} total reservations found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking: any) => (
                  <div key={booking.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:border-green-300 transition-colors bg-white">
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-gray-900 text-lg">{booking.turfName}</p>
                        <Badge 
                          variant={booking.status === 'completed' ? 'default' : 'secondary'}
                          className={booking.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center mt-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        {booking.location}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        {booking.date} • {booking.time}
                      </p>
                    </div>
                    <div className="text-left md:text-right w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start">
                      {booking.status === 'completed' ? (
                        <Link href={`/feedback/${booking.id}`}>
                          <Button size="sm" variant="outline" className="font-medium text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200">
                            Give Feedback/Review
                          </Button>
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">{booking.sport}</p>
                      )}
                      
                      {booking.status === 'upcoming' && (
                        <Link href={`/book/${booking.turfId}`} className="mt-0 md:mt-3">
                          <Button size="sm" variant="outline" className="border-green-200 hover:bg-green-50 text-green-700">
                            Manage Booking
                          </Button>
                        </Link>
                      )}
                      
                      {booking.status === 'completed' && (
                        <Link href={`/book/${booking.turfId}`} className="mt-0 md:mt-3">
                          <Button size="sm" variant="outline" className="border-gray-200">
                             Book Again
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                 <div className="text-center py-12">
                   <p className="text-gray-500 mb-4">No bookings found</p>
                   <Link href="/browse">
                     <Button className="bg-green-600 hover:bg-green-700">Find a Turf Now</Button>
                   </Link>
                 </div>
              )}
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}

export default function PlayerBookingsPage() {
  return (
    <ProtectedRoute requireRole="customer">
      <PlayerBookings />
    </ProtectedRoute>
  );
}
