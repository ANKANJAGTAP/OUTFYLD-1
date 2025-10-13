'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Wifi, 
  Car, 
  Zap, 
  WashingMachine,
  Phone,
  Mail,
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import { format, isSameDay, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
// Import PaymentModal component
import PaymentModal from '@/components/booking/PaymentModal';
import { WeekCalendar } from '@/components/booking/WeekCalendar';

interface TurfData {
  _id: string;
  ownerId: string; // Add ownerId field
  name: string;
  businessName: string;
  email: string;
  phone?: string;
  turfImages: Array<{
    url: string;
    public_id: string;
  }>;
  sportsOffered: string[];
  customSport?: string;
  amenities: string[];
  about: string;
  pricing: number;
  location: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  availableSlots: Array<{
    day: string;
    date?: string; // ISO date string from API
    startTime: string;
    endTime: string;
    isBooked: boolean;
  }>;
  upiQrCode: {
    url: string;
    public_id: string;
  };
}

interface TurfDetailsPageProps {
  turfId: string;
}

const amenityIcons: { [key: string]: React.ReactNode } = {
  'Floodlights': <Zap className="w-4 h-4" />,
  'Parking': <Car className="w-4 h-4" />,
  'Washroom': <WashingMachine className="w-4 h-4" />,
  'Equipment': <Users className="w-4 h-4" />,
  'WiFi': <Wifi className="w-4 h-4" />
};

export default function TurfDetailsPage({ turfId }: TurfDetailsPageProps) {
  const [turf, setTurf] = useState<TurfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    date: Date;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Array<{
    date: string; // YYYY-MM-DD format
    startTime: string;
    endTime: string;
  }>>([]);

  const fetchTurfDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/turfs/${turfId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch turf details');
      }

      const data = await response.json();
      setTurf(data.turf);
    } catch (error) {
      console.error('Error fetching turf details:', error);
      setError('Failed to load turf details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [turfId]);

  const fetchBookedSlots = useCallback(async () => {
    try {
      // Get the week range based on selected date, or current date if none selected
      const baseDate = selectedDate || new Date();
      const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 }); // Sunday
      
      console.log('Fetching booked slots for week:', {
        baseDate: format(baseDate, 'yyyy-MM-dd'),
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd')
      });
      
      // Use the new confirmed bookings endpoint
      const response = await fetch(`/api/bookings/turf/${turfId}/confirmed?start=${format(weekStart, 'yyyy-MM-dd')}&end=${format(weekEnd, 'yyyy-MM-dd')}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received booked slots:', data.bookedSlots);
        setBookedSlots(data.bookedSlots || []);
      } else {
        console.log('Failed to fetch booked slots:', response.status);
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      // Don't set error state as this is not critical
    }
  }, [turfId, selectedDate]);

  useEffect(() => {
    fetchTurfDetails();
    fetchBookedSlots();

    // Set up polling to refresh booked slots every 10 seconds
    // This ensures approved bookings show up on customer side quickly
    const pollInterval = setInterval(() => {
      fetchBookedSlots();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [turfId, fetchTurfDetails, fetchBookedSlots]);

  const handleSlotSelect = (slot: { day: string; startTime: string; endTime: string }, date: Date) => {
    setSelectedSlot({
      ...slot,
      date
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null); // Clear selected slot when date changes
  };

  const handleProceedToPayment = () => {
    if (selectedSlot) {
      setShowPaymentModal(true);
    }
  };

  const handleBookingSuccess = () => {
    setShowPaymentModal(false);
    setSelectedSlot(null);
    // Refresh both turf details and booked slots
    fetchTurfDetails();
    fetchBookedSlots();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading turf details...</p>
        </div>
      </div>
    );
  }

  if (error || !turf) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            {error || 'Turf not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get available slots for the selected date
  const getAvailableSlotsForDate = (date: Date) => {
    if (!turf) return [];
    
    const dayName = format(date, 'EEEE'); // Monday, Tuesday, etc.
    const dateString = format(date, 'yyyy-MM-dd');
    
    console.log('Getting slots for:', { dayName, dateString, bookedSlotsCount: bookedSlots.length });
    
    // Get all slots for this day of the week
    const daySlots = turf.availableSlots.filter(slot => slot.day === dayName);
    
    // Check which slots are booked for this specific date and override isBooked
    return daySlots.map(slot => {
      const isBookedForThisDate = bookedSlots.some(bookedSlot => 
        bookedSlot.date === dateString &&
        bookedSlot.startTime === slot.startTime &&
        bookedSlot.endTime === slot.endTime
      );
      
      console.log(`Slot ${slot.startTime}-${slot.endTime}:`, {
        originalIsBooked: slot.isBooked,
        isBookedForThisDate,
        dateString,
        bookedSlots: bookedSlots.filter(bs => bs.startTime === slot.startTime && bs.endTime === slot.endTime)
      });
      
      return {
        ...slot,
        isBooked: isBookedForThisDate // Override with date-specific booking status
      };
    });
  };

  const availableSlotsForSelectedDate = selectedDate ? getAvailableSlotsForDate(selectedDate) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{turf.businessName}</h1>
          <div className="flex items-center text-gray-600 mb-4">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{turf.location.address}, {turf.location.city}, {turf.location.state} - {turf.location.pincode}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-1" />
              <span className="text-sm">{turf.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              <span className="text-sm">{turf.email}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {turf.turfImages.slice(0, 4).map((image, index) => (
                    <div key={index} className={`relative ${index === 0 ? 'md:row-span-2' : ''} h-64 md:h-48 ${index === 0 ? 'md:h-96' : ''}`}>
                      <Image
                        src={image.url}
                        alt={`${turf.businessName} - Image ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={index === 0}
                        className="object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About This Turf</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{turf.about}</p>
              </CardContent>
            </Card>

            {/* Sports & Amenities */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sports Offered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {turf.sportsOffered.map((sport) => (
                      <Badge key={sport} variant="secondary">
                        {sport}
                      </Badge>
                    ))}
                    {turf.customSport && (
                      <Badge variant="secondary">{turf.customSport}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {turf.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        {amenityIcons[amenity] || <Users className="w-4 h-4" />}
                        <span className="ml-2">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calendar and Available Slots */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Calendar */}
              <WeekCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />

              {/* Available Slots for Selected Date */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedDate 
                      ? `Available Slots - ${format(selectedDate, 'EEEE, MMM d')}`
                      : 'Select a Date to View Slots'
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    availableSlotsForSelectedDate.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {availableSlotsForSelectedDate.map((slot, index) => (
                          <Button
                            key={index}
                            variant={
                              selectedSlot?.startTime === slot.startTime &&
                              selectedSlot?.endTime === slot.endTime &&
                              selectedSlot?.date && selectedDate &&
                              isSameDay(selectedSlot.date, selectedDate)
                                ? "default"
                                : slot.isBooked 
                                  ? "destructive"
                                  : "outline"
                            }
                            disabled={slot.isBooked}
                            className={`text-sm ${
                              slot.isBooked 
                                ? 'bg-red-100 text-red-800 border-red-300 cursor-not-allowed hover:bg-red-100' 
                                : ''
                            }`}
                            onClick={() => !slot.isBooked && handleSlotSelect(slot, selectedDate)}
                          >
                            {slot.startTime} - {slot.endTime}
                            {slot.isBooked && (
                              <span className="ml-1 text-xs">(Booked)</span>
                            )}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No slots available for this date</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Please select a date to view available slots</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Booking Summary</span>
                  <span className="text-2xl font-bold text-green-600">₹{turf.pricing}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedSlot && selectedDate ? (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Selected Slot</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium">{format(selectedDate, 'EEEE, MMM d')}</p>
                        <p className="text-sm text-gray-600">
                          {selectedSlot.startTime} - {selectedSlot.endTime}
                        </p>
                      </div>
                      <Separator className="my-4" />
                      <div className="flex justify-between font-medium">
                        <span>Total Amount:</span>
                        <span className="text-green-600">₹{turf.pricing}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Select a date and time slot to continue</p>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full" 
                    disabled={!selectedSlot || !selectedDate}
                    onClick={handleProceedToPayment}
                  >
                    Proceed to Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedSlot && selectedDate && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          turf={turf}
          selectedSlot={{ ...selectedSlot, date: selectedDate }}
          totalAmount={turf.pricing}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}