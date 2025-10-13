'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Clock, 
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Eye
} from 'lucide-react';
import Image from 'next/image';

interface BookingData {
  _id: string;
  ownerId: {
    _id: string;
    name: string;
    email: string;
    businessName: string;
    phone?: string;
  };
  turfId: {
    _id: string;
    businessName: string;
    location: {
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    pricing: number;
    sportsOffered: string[];
    amenities: string[];
  };
  slot: {
    day: string;
    startTime: string;
    endTime: string;
  };
  status: 'pending' | 'confirmed' | 'rejected';
  totalAmount: number;
  paymentScreenshot: {
    url: string;
    public_id: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CustomerBookingHistoryProps {
  customerId: string;
}

export default function CustomerBookingHistory({ customerId }: CustomerBookingHistoryProps) {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [customerId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/bookings/customer/${customerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending Review</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="text-green-600 border-green-600">Confirmed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingBookings = bookings.filter(booking => booking.status === 'pending');
  const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed');
  const rejectedBookings = bookings.filter(booking => booking.status === 'rejected');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <span>Loading your bookings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const renderBookingCard = (booking: BookingData) => (
    <Card key={booking._id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {getStatusIcon(booking.status)}
              {booking.turfId.businessName}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {booking.turfId.location.city}, {booking.turfId.location.state}
              </div>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(booking.status)}
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(booking.createdAt)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Booking Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{booking.slot.day}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{booking.slot.startTime} - {booking.slot.endTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{booking.turfId.location.address}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Amount Paid:</span>
              <span className="text-lg font-bold text-green-600">₹{booking.totalAmount}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Owner Contact</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{booking.ownerId.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{booking.ownerId.email}</span>
                </div>
                {booking.ownerId.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{booking.ownerId.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sports and Amenities */}
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-1">Sports Available</h5>
              <div className="flex flex-wrap gap-1">
                {booking.turfId.sportsOffered.slice(0, 3).map((sport) => (
                  <Badge key={sport} variant="secondary" className="text-xs">
                    {sport}
                  </Badge>
                ))}
                {booking.turfId.sportsOffered.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{booking.turfId.sportsOffered.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status-specific messages */}
        {booking.status === 'pending' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                Your booking is being reviewed by the turf owner. You'll be notified once it's approved or rejected.
              </span>
            </div>
          </div>
        )}
        
        {booking.status === 'confirmed' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Your booking has been confirmed! Please arrive on time at the turf.
              </span>
            </div>
          </div>
        )}
        
        {booking.status === 'rejected' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Unfortunately, your booking was rejected. Please contact the turf owner for more details or try booking a different slot.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Bookings</h2>
        <p className="text-gray-600">Track your turf booking requests and confirmations</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't made any turf bookings yet. Browse available turfs to make your first booking!
            </p>
            <button 
              onClick={() => window.location.href = '/browse'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Turfs
            </button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Review</p>
                    <p className="text-2xl font-bold text-yellow-600">{pendingBookings.length}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Confirmed</p>
                    <p className="text-2xl font-bold text-green-600">{confirmedBookings.length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{confirmedBookings.reduce((sum, booking) => sum + booking.totalAmount, 0)}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">₹</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bookings Tabs */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">
                All Bookings ({bookings.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending ({pendingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Confirmed ({confirmedBookings.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Rejected ({rejectedBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {bookings.map(renderBookingCard)}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingBookings.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Bookings</h3>
                    <p className="text-gray-600">You have no bookings awaiting review.</p>
                  </CardContent>
                </Card>
              ) : (
                pendingBookings.map(renderBookingCard)
              )}
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-4">
              {confirmedBookings.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Confirmed Bookings</h3>
                    <p className="text-gray-600">You have no confirmed bookings yet.</p>
                  </CardContent>
                </Card>
              ) : (
                confirmedBookings.map(renderBookingCard)
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {rejectedBookings.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <XCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Rejected Bookings</h3>
                    <p className="text-gray-600">You have no rejected bookings.</p>
                  </CardContent>
                </Card>
              ) : (
                rejectedBookings.map(renderBookingCard)
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}