'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
  Loader2,
  Lock
} from 'lucide-react';
import Image from 'next/image';
import { format, isSameDay, startOfWeek, endOfWeek, isWithinInterval, parseISO, addMonths, isAfter, startOfDay } from 'date-fns';
// Import PaymentModal component
import PaymentModal from '@/components/booking/PaymentModal';
import { WeekCalendar } from '@/components/booking/WeekCalendar';
import { useAuth } from '@/contexts/AuthContext';

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

const TurfDetailsPage = memo(function TurfDetailsPage({ turfId }: TurfDetailsPageProps) {
  const { user } = useAuth();
  const [turf, setTurf] = useState<TurfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<Array<{
    day: string;
    date: Date;
    startTime: string;
    endTime: string;
  }>>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Array<{
    date: string; // YYYY-MM-DD format
    startTime: string;
    endTime: string;
  }>>([]);
  const [slotVerificationLoading, setSlotVerificationLoading] = useState(false);
  const [reservationExpiry, setReservationExpiry] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [paymentModalTimer, setPaymentModalTimer] = useState<number>(0);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'error' | 'warning' | 'success' | 'info';
    message: string;
  } | null>(null);

  // Simple alert system to replace toasts
  const showAlert = useCallback((message: string, type: 'error' | 'warning' | 'success' | 'info' = 'info') => {
    setAlertMessage({ message, type });
    // Auto hide after 5 seconds
    setTimeout(() => {
      setAlertMessage(null);
    }, 5000);
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!reservationExpiry) {
      setCountdown(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = reservationExpiry.getTime();
      const remaining = Math.max(0, expiry - now);
      setCountdown(Math.floor(remaining / 1000));

      if (remaining <= 0) {
        setReservationExpiry(null);
        setCountdown(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservationExpiry]);

  // Payment modal auto-close timer (10 minutes)
  useEffect(() => {
    if (!showPaymentModal) {
      setPaymentModalTimer(0);
      return;
    }

    // Set 10-minute timer (600 seconds)
    setPaymentModalTimer(600);

    const interval = setInterval(() => {
      setPaymentModalTimer((prev) => {
        if (prev <= 1) {
          // Timer expired, close modal and show notification
          setShowPaymentModal(false);
          setReservationExpiry(null);
          showAlert(
            '⏰ Payment time expired. Your slot reservation has been released.',
            'warning'
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showPaymentModal, showAlert]);

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
      
      // Use the new confirmed bookings endpoint
      const response = await fetch(`/api/bookings/turf/${turfId}/confirmed?start=${format(weekStart, 'yyyy-MM-dd')}&end=${format(weekEnd, 'yyyy-MM-dd')}`);
      
      if (response.ok) {
        const data = await response.json();
        setBookedSlots(data.bookedSlots || []);
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      // Don't set error state as this is not critical
    }
  }, [turfId, selectedDate]);

  // Effect for initial data fetching
  useEffect(() => {
    fetchTurfDetails();
  }, [turfId, fetchTurfDetails]);

  // Effect for fetching booked slots when date changes
  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  // Effect for setting up polling (separate from date changes)
  useEffect(() => {
    // Set up more frequent polling to catch slot conflicts quickly
    // Reduced from 30 seconds to 15 seconds for better conflict detection
    const pollInterval = setInterval(() => {
      fetchBookedSlots();
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(pollInterval);
  }, [fetchBookedSlots]);

  const handleSlotSelect = useCallback((slot: { day: string; startTime: string; endTime: string }, date: Date) => {
    const slotWithDate = { ...slot, date };
    const slotKey = `${slot.startTime}-${slot.endTime}`;
    
    setSelectedSlots(prevSlots => {
      // Check if this slot is already selected for this date
      const existingSlotIndex = prevSlots.findIndex(s => 
        s.startTime === slot.startTime && 
        s.endTime === slot.endTime && 
        isSameDay(s.date, date)
      );
      
      if (existingSlotIndex >= 0) {
        // Remove the slot if it's already selected
        return prevSlots.filter((_, index) => index !== existingSlotIndex);
      } else {
        // Add the slot if it's not selected
        return [...prevSlots, slotWithDate];
      }
    });
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    const today = startOfDay(new Date());
    const maxBookingDate = addMonths(today, 1);
    
    // Check if the selected date is within the allowed booking window
    if (isAfter(date, maxBookingDate)) {
      showAlert(
        'Bookings are only allowed up to 1 month in advance.',
        'info'
      );
      return;
    }
    
    setSelectedDate(date);
    setSelectedSlots([]); // Clear selected slots when date changes
  }, []);

  const handleProceedToPayment = useCallback(async () => {
    if (selectedSlots.length === 0 || slotVerificationLoading) return;

    setSlotVerificationLoading(true);

    // Verify slots are still available before proceeding to payment
    try {
      const verifyResponse = await fetch('/api/bookings/verify-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slots: selectedSlots.map(slot => ({
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            date: format(slot.date, 'yyyy-MM-dd')
          })),
          turfId
        })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyData.available) {
        // Some slots are no longer available
        showAlert(
          '⚠️ Some selected slots are no longer available. Another customer may have just booked them. Please select again.',
          'error'
        );
        
        // Refresh slot availability and clear selections
        await fetchBookedSlots();
        setSelectedSlots([]);
        return;
      }

      // If user is logged in, reserve the slots for 10 minutes
      if (user) {
        const reserveResponse = await fetch('/api/bookings/reserve-slots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'reserve',
            turfId,
            customerId: user.uid,
            slots: selectedSlots.map(slot => ({
              day: slot.day,
              date: format(slot.date, 'yyyy-MM-dd'),
              startTime: slot.startTime,
              endTime: slot.endTime,
            })),
          }),
        });

        const reserveData = await reserveResponse.json();

        if (!reserveResponse.ok) {
          showAlert(
            '🔒 This slot is currently being booked by another customer. Please wait a moment or select a different slot.',
            'warning'
          );
          return;
        }

        // Set reservation expiry (10 minutes from now)
        setReservationExpiry(new Date(Date.now() + 10 * 60 * 1000));
        
        // Show success notification
        showAlert(
          '✅ Slots reserved successfully! Complete payment within 10 minutes.',
          'success'
        );
      }

      // All slots are verified and reserved, proceed to payment
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error proceeding to payment:', error);
      showAlert(
        'Unable to proceed to payment. Please try again.',
        'error'
      );
    } finally {
      setSlotVerificationLoading(false);
    }
  }, [selectedSlots, turfId, fetchBookedSlots, slotVerificationLoading, user]);

  const handleBookingSuccess = useCallback(() => {
    setShowPaymentModal(false);
    setSelectedSlots([]); // Clear all selected slots
    setReservationExpiry(null); // Clear reservation expiry
    // Refresh both turf details and booked slots
    fetchTurfDetails();
    fetchBookedSlots();
  }, [fetchTurfDetails, fetchBookedSlots]);

  const handlePaymentModalClose = useCallback(async () => {
    // Clear any reservations when payment modal is closed without completing payment
    if (user && reservationExpiry) {
      try {
        await fetch('/api/bookings/clear-reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: user.uid,
            turfId,
          }),
        });
      } catch (error) {
        console.error('Error clearing reservations:', error);
      }
    }
    
    setShowPaymentModal(false);
    setReservationExpiry(null);
  }, [user, reservationExpiry, turfId]);

  // Get available slots for the selected date - memoized to prevent unnecessary recalculations
  // This must be before any conditional returns to follow Rules of Hooks
  const availableSlotsForSelectedDate = useMemo(() => {
    if (!selectedDate || !turf) return [];
    
    const dayName = format(selectedDate, 'EEEE'); // Monday, Tuesday, etc.
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    
    // Check if selected date is today
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const isToday = dateString === todayStr;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Get all slots for this day of the week
    const daySlots = turf.availableSlots.filter(slot => {
      if (slot.day !== dayName) return false;
      
      // If it's today, filter out past time slots
      if (isToday) {
        const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
        const slotTimeInMinutes = slotHour * 60 + slotMinute;
        
        // Only show slots that haven't started yet
        return slotTimeInMinutes > currentTimeInMinutes;
      }
      
      return true;
    });
    
    // Remove duplicates by creating a Map with unique time combinations
    const uniqueSlots = new Map();
    
    daySlots.forEach(slot => {
      const slotKey = `${slot.startTime}-${slot.endTime}`;
      if (!uniqueSlots.has(slotKey)) {
        // Check if this specific time slot is booked for this date
        const isBookedForThisDate = bookedSlots.some(bookedSlot => 
          bookedSlot.date === dateString &&
          bookedSlot.startTime === slot.startTime &&
          bookedSlot.endTime === slot.endTime
        );
        
        uniqueSlots.set(slotKey, {
          ...slot,
          isBooked: isBookedForThisDate // Override with date-specific booking status
        });
      }
    });
    
    // Convert Map values back to array and sort by start time
    return Array.from(uniqueSlots.values()).sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );
  }, [selectedDate, turf, bookedSlots]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alert Message */}
      {alertMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <Alert className={`${
            alertMessage.type === 'error' ? 'border-red-200 bg-red-50' :
            alertMessage.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
            alertMessage.type === 'success' ? 'border-green-200 bg-green-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <AlertDescription className={`${
              alertMessage.type === 'error' ? 'text-red-800' :
              alertMessage.type === 'warning' ? 'text-yellow-800' :
              alertMessage.type === 'success' ? 'text-green-800' :
              'text-blue-800'
            }`}>
              {alertMessage.message}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
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
            <div className="space-y-6">
              {/* Calendar - Full Width */}
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
                      <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
                        {availableSlotsForSelectedDate.map((slot, index) => {
                          // Check if this slot is selected
                          const isSlotSelected = selectedSlots.some(s => 
                            s.startTime === slot.startTime && 
                            s.endTime === slot.endTime &&
                            selectedDate && isSameDay(s.date, selectedDate)
                          );
                          
                          // Create unique key - since we removed duplicates, this is safe
                          const uniqueKey = `${slot.startTime}-${slot.endTime}`;
                          
                          return (
                            <Button
                              key={uniqueKey}
                              type="button"
                              variant={
                                isSlotSelected
                                  ? "default"
                                  : slot.isBooked 
                                    ? "destructive"
                                    : "outline"
                              }
                              disabled={slot.isBooked}
                              className={`text-sm ${
                                slot.isBooked 
                                  ? 'bg-red-100 text-red-800 border-red-300 cursor-not-allowed hover:bg-red-100' 
                                  : isSlotSelected
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : ''
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                if (!slot.isBooked && selectedDate) {
                                  handleSlotSelect(slot, selectedDate);
                                }
                              }}
                            >
                              {slot.startTime} - {slot.endTime}
                              {slot.isBooked && (
                                <span className="ml-1 text-xs">(Booked)</span>
                              )}
                              {isSlotSelected && (
                                <span className="ml-1 text-xs">✓</span>
                              )}
                            </Button>
                          );
                        })}
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
                  {selectedSlots.length > 0 && selectedDate ? (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Selected Slots ({selectedSlots.length})
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                        <p className="font-medium">{format(selectedDate, 'EEEE, MMM d')}</p>
                        <div className="space-y-1">
                          {selectedSlots.map((slot, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">
                                {slot.startTime} - {slot.endTime}
                              </span>
                              <span className="text-green-600 font-medium">₹{turf.pricing}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Reservation Timer */}
                      {reservationExpiry && countdown > 0 && (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-blue-700">
                              <Lock className="w-4 h-4 mr-2" />
                              <span className="text-sm font-medium">Slots Reserved</span>
                            </div>
                            <div className="text-blue-600 font-mono text-sm">
                              {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                            </div>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            Complete payment within {Math.floor(countdown / 60)} minutes
                          </p>
                        </div>
                      )}
                      <Separator className="my-4" />
                      <div className="flex justify-between font-medium">
                        <span>Total Amount:</span>
                        <span className="text-green-600 text-lg">
                          ₹{(turf.pricing * selectedSlots.length).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Select a date and time slots to continue</p>
                    </div>
                  )}
                  
                  <Button 
                    type="button"
                    className="w-full" 
                    disabled={selectedSlots.length === 0 || !selectedDate || slotVerificationLoading}
                    onClick={(e) => {
                      e.preventDefault();
                      handleProceedToPayment();
                    }}
                  >
                    {slotVerificationLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying Availability...
                      </>
                    ) : (
                      <>
                        Proceed to Payment
                        {selectedSlots.length > 0 && (
                          <span className="ml-2">({selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''})</span>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedSlots.length > 0 && selectedDate && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentModalClose}
          turf={turf}
          selectedSlots={selectedSlots.map(slot => ({ ...slot, date: selectedDate }))}
          totalAmount={turf.pricing * selectedSlots.length}
          onSuccess={handleBookingSuccess}
          paymentTimer={paymentModalTimer}
        />
      )}
    </div>
  );
});

export default TurfDetailsPage;