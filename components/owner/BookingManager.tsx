'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Bell,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';

interface BookingData {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  turfId: {
    _id: string;
    name: string;
    contactInfo?: {
      businessName: string;
    };
    location: {
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    pricing: number;
  } | null;
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

interface BookingManagerProps {
  ownerId: string;
  turfId?: string; // Optional: filter bookings by specific turf
  turfName?: string; // Optional: show turf name in header
}

export default function BookingManager({ ownerId, turfId, turfName }: BookingManagerProps) {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, selectedStatus, turfId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        ...(selectedStatus && { status: selectedStatus }),
        ...(turfId && { turfId })
      });

      const response = await fetch(`/api/bookings/owner/${ownerId}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: 'confirmed' | 'rejected') => {
    try {
      setProcessingBooking(bookingId);

      console.log('Updating booking status with endpoint:', `/api/bookings/${bookingId}/status`);

      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update booking status');
      }

      // Refresh bookings list
      await fetchBookings();
      
      // Show success message
      alert(`Booking ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update booking status');
    } finally {
      setProcessingBooking(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="text-green-600 border-green-600">Confirmed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
        <span>Loading bookings...</span>
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
              <User className="w-5 h-5" />
              {booking.customerId.name}
              {booking.status === 'pending' && (
                <Bell className="w-4 h-4 text-orange-500" />
              )}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {booking.customerId.email}
              </div>
              {booking.customerId.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {booking.customerId.phone}
                </div>
              )}
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
                  <span>
                    {booking.turfId?.name || booking.turfId?.contactInfo?.businessName || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount:</span>
              <span className="text-lg font-bold text-green-600">₹{booking.totalAmount}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Payment Screenshot</h4>
              <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={booking.paymentScreenshot.url}
                  alt="Payment Screenshot"
                  fill
                  className="object-cover"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => {
                  setSelectedBooking(booking);
                  setShowPaymentModal(true);
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                View Full Image
              </Button>
            </div>
          </div>
        </div>

        {booking.status === 'pending' && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => handleStatusUpdate(booking._id, 'rejected')}
              disabled={processingBooking === booking._id}
            >
              {processingBooking === booking._id ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-1" />
              )}
              Reject
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
              disabled={processingBooking === booking._id}
            >
              {processingBooking === booking._id ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-1" />
              )}
              Approve
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {turfName ? `Bookings for ${turfName}` : 'Booking Management'}
        </h2>
        <p className="text-gray-600">
          {turfName 
            ? `Manage booking requests for this turf` 
            : 'Manage your turf booking requests'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-orange-600">{pendingBookings.length}</p>
              </div>
              <Bell className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed Bookings</p>
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
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{confirmedBookings.reduce((sum, booking) => sum + booking.totalAmount, 0)}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">₹</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
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

        <TabsContent value="pending" className="space-y-4">
          {pendingBookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
                <p className="text-gray-600">You have no pending booking requests at the moment.</p>
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

      {/* Payment Screenshot Modal */}
      {showPaymentModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Payment Screenshot</h3>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedBooking(null);
                  }}
                >
                  Close
                </Button>
              </div>
              <div className="relative w-full h-96">
                <Image
                  src={selectedBooking.paymentScreenshot.url}
                  alt="Payment Screenshot"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Booking Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <span className="ml-2 font-medium">{selectedBooking.customerId.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <span className="ml-2 font-medium">₹{selectedBooking.totalAmount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Slot:</span>
                    <span className="ml-2 font-medium">
                      {selectedBooking.slot.day}, {selectedBooking.slot.startTime} - {selectedBooking.slot.endTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2">{getStatusBadge(selectedBooking.status)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}