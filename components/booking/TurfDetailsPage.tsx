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
  Lock,
  Tag,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import { format, isSameDay, startOfWeek, endOfWeek, isWithinInterval, parseISO, addMonths, isAfter, startOfDay } from 'date-fns';
import { GoogleMap, useLoadScript, MarkerF } from '@react-google-maps/api';
// Import PaymentModal component
import PaymentModal from '@/components/booking/PaymentModal';
import { WeekCalendar } from '@/components/booking/WeekCalendar';
import TurfImageGallery from '@/components/booking/TurfImageGallery';
import { useAuth } from '@/contexts/AuthContext';
import { OdometerText } from '@/components/night/OdometerText';
import { NightLoader } from '@/components/night/NightLoader';

// Google Maps night styling — proper styled map (not a CSS filter hack),
// tuned toward the pitch palette. Lime marker is drawn as a symbol.
const NIGHT_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#101914' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8fa096' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0f0c' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#14211a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1d2a23' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0e1512' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a3a30' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b1a17' }] },
];

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
  offerPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  offerLabel?: string;
  maxDiscount?: number;
  location: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  geoLocation?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
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

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.5rem',
};

const TurfDetailsPage = memo(function TurfDetailsPage({ turfId }: TurfDetailsPageProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

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
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);
  const [periodDiscounts, setPeriodDiscounts] = useState<Record<string, {
    originalPrice: number;
    offerPrice: number;
    discountPercent: number;
    discountAmount: number;
    offerLabel: string;
  }> | null>(null);
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
      if (data.periodDiscounts) {
        setPeriodDiscounts(data.periodDiscounts);
      }
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

  const handleDateSelect = useCallback(async (date: Date) => {
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

    // Fetch per-day pricing for the selected date
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await fetch(`/api/turfs/${turfId}/pricing?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        if (data.periodDiscounts) {
          setPeriodDiscounts(data.periodDiscounts);
        }
      }
    } catch (err) {
      console.error('Failed to fetch per-day pricing:', err);
    }
  }, [turfId]);

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

  // Helper: get the offer price for a slot based on its time period
  const getSlotOfferPrice = useCallback((startTime: string): { offerPrice: number; discountPercent: number; discountAmount: number } => {
    if (!turf || !periodDiscounts) return { offerPrice: turf?.pricing ?? 0, discountPercent: 0, discountAmount: 0 };
    const hour = parseInt(startTime.split(':')[0], 10);
    let period: string;
    if (hour >= 6 && hour < 12) period = 'morning';
    else if (hour >= 12 && hour < 18) period = 'afternoon';
    else if (hour >= 18 && hour < 24) period = 'night';
    else period = 'midnight';

    const pd = periodDiscounts[period];
    if (pd && pd.discountPercent > 0) {
      return { offerPrice: pd.offerPrice, discountPercent: pd.discountPercent, discountAmount: pd.discountAmount };
    }
    return { offerPrice: turf.pricing, discountPercent: 0, discountAmount: 0 };
  }, [turf, periodDiscounts]);

  const basePriceTotal = useMemo(() => turf ? turf.pricing * selectedSlots.length : 0, [turf, selectedSlots]);

  const dynamicDiscountAmount = useMemo(() => {
    if (!turf) return 0;
    const discountedTotal = selectedSlots.reduce((sum, slot) => {
      const { offerPrice } = getSlotOfferPrice(slot.startTime);
      return sum + offerPrice;
    }, 0);
    return basePriceTotal - discountedTotal;
  }, [basePriceTotal, getSlotOfferPrice, selectedSlots, turf]);

  const selectedSlotsTotal = useMemo(() => {
    let total = basePriceTotal - dynamicDiscountAmount;
    if (promoApplied) {
      total = Math.max(0, total - Math.min(100, total));
    }
    return total;
  }, [basePriceTotal, dynamicDiscountAmount, promoApplied]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <NightLoader label="Preparing the ground…" />
      </div>
    );
  }

  if (error || !turf) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md rounded-[4px] border border-red-900/60 bg-red-950/20 px-5 py-4 text-sm text-red-200">
          {error || 'Turf not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Alert Message — floodlight-language toasts */}
      {alertMessage && (
        <div className="fixed right-4 top-20 z-50 max-w-sm">
          <div
            className={`rounded-[4px] border px-4 py-3 text-sm backdrop-blur-md ${
              alertMessage.type === 'error'
                ? 'border-red-900/70 bg-red-950/70 text-red-200'
                : alertMessage.type === 'warning'
                  ? 'border-amber-900/70 bg-amber-950/60 text-amber-200'
                  : alertMessage.type === 'success'
                    ? 'border-flood-500/50 bg-pitch-700/90 text-chalk-100 shadow-flood'
                    : 'border-pitchline bg-pitch-700/90 text-chalk-100'
            }`}
          >
            {alertMessage.message}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header — the match ticket masthead */}
        <div className="mb-10">
          <p className="nm-overline mb-3 text-flood-500">
            The match ticket · {turf.location.city || 'OutFyld arena'}
          </p>
          <h1 className="nm-display-l text-chalk-100">{turf.businessName}</h1>
          <div className="mt-4 flex items-center gap-2 text-chalk-400">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="text-sm">
              {turf.location.address}, {turf.location.city}, {turf.location.state} -{' '}
              {turf.location.pincode}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-6 font-mono text-xs text-chalk-400">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {turf.phone || 'N/A'}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {turf.email}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <TurfImageGallery images={turf.turfImages} altFallback={turf.businessName} />

            {/* About */}
            <div className="rounded-[4px] border border-pitchline bg-pitch-700/90 p-6">
              <p className="nm-overline mb-4 text-chalk-400">About this ground</p>
              <p className="text-sm leading-relaxed text-chalk-100/90">{turf.about}</p>
            </div>

            {/* Sports & Amenities */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[4px] border border-pitchline bg-pitch-700/90 p-6">
                <p className="nm-overline mb-4 text-chalk-400">Sports on offer</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {turf.sportsOffered.map((sport) => (
                    <span
                      key={sport}
                      className="font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-100"
                    >
                      {sport}
                    </span>
                  ))}
                  {turf.customSport && (
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-100">
                      {turf.customSport}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-[4px] border border-pitchline bg-pitch-700/90 p-6">
                <p className="nm-overline mb-4 text-chalk-400">Amenities</p>
                <div className="space-y-2.5">
                  {turf.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center text-flood-500">
                      {amenityIcons[amenity] || <Users className="h-4 w-4" />}
                      <span className="ml-2.5 text-sm text-chalk-100/90">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Location Map */}
            {(() => {
              const rawLat = turf.location?.coordinates?.latitude ?? turf.geoLocation?.coordinates?.[1];
              const rawLng = turf.location?.coordinates?.longitude ?? turf.geoLocation?.coordinates?.[0];
              
              if (!rawLat || !rawLng || !isLoaded) return null;

              const lat = Number(rawLat);
              const lng = Number(rawLng);

              if (isNaN(lat) || isNaN(lng)) return null;
              
              return (
                <div className="overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/90">
                  <div className="flex items-center justify-between border-b border-pitchline/60 px-6 py-4">
                    <p className="nm-overline text-chalk-400">Find the ground</p>
                    <button
                      className="flex items-center gap-2 rounded-[3px] border border-pitchline px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-100 transition-colors duration-200 ease-night hover:border-flood-500 hover:text-flood-500"
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open in Maps
                    </button>
                  </div>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={{ lat, lng }}
                    zoom={15}
                    options={{
                      styles: NIGHT_MAP_STYLES,
                      disableDefaultUI: true,
                      zoomControl: true,
                      backgroundColor: '#0e1512',
                    }}
                  >
                    {/* lime marker with a soft flood-glow ring */}
                    <MarkerF
                      position={{ lat, lng }}
                      icon={{
                        path: window.google?.maps?.SymbolPath?.CIRCLE,
                        scale: 9,
                        fillColor: '#C8F135',
                        fillOpacity: 1,
                        strokeColor: '#C8F135',
                        strokeOpacity: 0.25,
                        strokeWeight: 10,
                      }}
                    />
                  </GoogleMap>
                  <div className="flex items-start gap-2 border-t border-pitchline/60 px-6 py-4 text-sm text-chalk-400">
                    <MapPin className="h-4 w-4 shrink-0 text-flood-500" />
                    <p>
                      {turf.location?.address}, {turf.location?.city}, {turf.location?.state} -{' '}
                      {turf.location?.pincode}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Calendar and Available Slots */}
            <div className="space-y-6">
              {/* Calendar - Full Width */}
              <WeekCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />

              {/* FIXTURE SLOTS — mono time chips: chalk available, lime selected, struck silhouette booked */}
              <div className="rounded-[4px] border border-pitchline bg-pitch-700/90">
                <div className="border-b border-pitchline/60 px-6 py-4">
                  <p className="nm-overline text-chalk-400">
                    {selectedDate
                      ? `Fixture slots — ${format(selectedDate, 'EEEE, MMM d')}`
                      : 'Pick a matchday to view slots'}
                  </p>
                </div>
                <div className="p-6">
                  {selectedDate ? (
                    availableSlotsForSelectedDate.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        {availableSlotsForSelectedDate.map((slot) => {
                          const isSlotSelected = selectedSlots.some(
                            (s) =>
                              s.startTime === slot.startTime &&
                              s.endTime === slot.endTime &&
                              selectedDate &&
                              isSameDay(s.date, selectedDate)
                          );
                          const uniqueKey = `${slot.startTime}-${slot.endTime}`;

                          return (
                            <button
                              key={uniqueKey}
                              type="button"
                              disabled={slot.isBooked}
                              className={`flex flex-col items-center rounded-[3px] border px-2 py-2.5 font-mono transition-[background-color,border-color,box-shadow,color] duration-200 ease-night ${
                                slot.isBooked
                                  ? 'cursor-not-allowed border-pitchline/50 text-chalk-400/35'
                                  : isSlotSelected
                                    ? 'border-flood-500 bg-flood-500 text-pitch-900 shadow-flood'
                                    : 'border-pitchline bg-pitch-800/60 text-chalk-100 hover:border-flood-500/60'
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                if (!slot.isBooked && selectedDate) {
                                  handleSlotSelect(slot, selectedDate);
                                }
                              }}
                            >
                              <span
                                className={`text-xs tabular-nums ${slot.isBooked ? 'line-through' : ''}`}
                              >
                                {slot.startTime}–{slot.endTime}
                              </span>
                              {(() => {
                                if (slot.isBooked)
                                  return (
                                    <span className="mt-0.5 text-[10px] uppercase tracking-[0.1em]">
                                      Taken
                                    </span>
                                  );
                                const { offerPrice, discountPercent } = getSlotOfferPrice(slot.startTime);
                                if (discountPercent > 0 && turf) {
                                  return (
                                    <span className="mt-0.5 text-[10px] tabular-nums">
                                      <span
                                        className={`line-through ${isSlotSelected ? 'text-pitch-900/50' : 'text-chalk-400/60'}`}
                                      >
                                        ₹{turf.pricing}
                                      </span>{' '}
                                      ₹{offerPrice}
                                    </span>
                                  );
                                }
                                return turf ? (
                                  <span className="mt-0.5 text-[10px] tabular-nums">₹{turf.pricing}</span>
                                ) : null;
                              })()}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-chalk-400">
                        <Clock className="mx-auto mb-3 h-7 w-7 opacity-50" />
                        <p className="font-mono text-[11px] uppercase tracking-[0.14em]">
                          No slots on this date
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="py-10 text-center text-chalk-400">
                      <Clock className="mx-auto mb-3 h-7 w-7 opacity-50" />
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em]">
                        Pick a matchday above
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar — THE TICKET STUB */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/95">
              {/* stub masthead */}
              <div className="px-6 pb-5 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="nm-overline mb-2 text-flood-500">Match ticket</p>
                    <h3 className="line-clamp-2 font-display text-2xl uppercase leading-none tracking-tight text-chalk-100">
                      {turf.businessName}
                    </h3>
                  </div>
                  <div className="shrink-0 text-right">
                    {turf.discountPercent && turf.discountPercent > 0 ? (
                      <>
                        <span className="block font-mono text-xs text-chalk-400/70 line-through">
                          ₹{turf.pricing}
                        </span>
                        <span className="font-mono text-2xl tracking-tight text-chalk-100">
                          ₹{turf.offerPrice}
                        </span>
                        <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-flood-500">
                          {turf.offerLabel}
                        </span>
                      </>
                    ) : (
                      <span className="font-mono text-2xl tracking-tight text-chalk-100">
                        ₹{turf.pricing}
                      </span>
                    )}
                    <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-chalk-400">
                      per hour
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-6 pb-5">
                  {selectedSlots.length > 0 && selectedDate ? (
                    <div key={`${format(selectedDate, 'yyyy-MM-dd')}-${selectedSlots.length}`} className="nm-print">
                      <p className="nm-overline mb-2 text-chalk-400">
                        Selected slots ({selectedSlots.length})
                      </p>
                      <div className="space-y-2 rounded-[3px] border border-pitchline/70 bg-pitch-800/60 p-3">
                        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-100">
                          {format(selectedDate, 'EEEE, MMM d')}
                        </p>
                        <div className="space-y-1">
                          {selectedSlots.map((slot, index) => {
                            const { offerPrice, discountPercent } = getSlotOfferPrice(slot.startTime);
                            const showOffer = !promoApplied && discountPercent > 0;
                            return (
                              <div key={index} className="flex items-center justify-between font-mono text-xs tabular-nums">
                                <span className="text-chalk-400">
                                  {slot.startTime}–{slot.endTime}
                                </span>
                                {showOffer ? (
                                  <span className="text-chalk-100">
                                    <span className="mr-1.5 text-[10px] text-chalk-400/60 line-through">₹{turf.pricing}</span>
                                    ₹{offerPrice}
                                  </span>
                                ) : (
                                  <span className="text-chalk-100">₹{turf.pricing}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Reservation Timer */}
                      {reservationExpiry && countdown > 0 && (
                        <div className="mt-3 rounded-[3px] border border-flood-500/40 bg-flood-500/[0.06] p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-chalk-100">
                              <Lock className="mr-2 h-4 w-4 text-flood-500" />
                              <span className="font-mono text-[11px] uppercase tracking-[0.12em]">
                                Slots reserved
                              </span>
                            </div>
                            <div className="font-mono text-sm tabular-nums text-flood-500">
                              {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                            </div>
                          </div>
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-400">
                            Complete payment within {Math.floor(countdown / 60)} min
                          </p>
                        </div>
                      )}
                      <Separator className="my-4 bg-pitchline" />

                      {/* Dynamic discount summary */}
                      {dynamicDiscountAmount > 0 && (
                        <div className="mb-1 flex justify-between font-mono text-xs tabular-nums text-flood-500">
                          <span className="uppercase tracking-[0.1em]">Off-peak discount</span>
                          <span>−₹{dynamicDiscountAmount}</span>
                        </div>
                      )}

                      {/* Promo discount display */}
                      {promoApplied && (
                        <div className="mb-1 flex justify-between font-mono text-xs tabular-nums text-flood-500">
                          <span className="flex items-center gap-2 uppercase tracking-[0.1em]">
                            WELCOME100
                            <button
                              onClick={() => {
                                setPromoApplied(false);
                                setPromoCode('');
                              }}
                              className="text-[10px] text-chalk-400 underline hover:text-chalk-100"
                            >
                              Remove
                            </button>
                          </span>
                          <span>−₹{Math.min(100, turf.pricing * selectedSlots.length)}</span>
                        </div>
                      )}

                      {/* Promo code input */}
                      {!promoApplied && (
                        <div className="mb-3">
                          <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
                            <Tag className="h-3 w-3" /> Promo code
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="min-w-0 flex-1 rounded-[3px] border border-pitchline bg-pitch-800/70 px-2.5 py-1.5 font-mono text-sm text-chalk-100 outline-none transition-[border-color] duration-200 ease-night placeholder:text-chalk-400/40 focus:border-flood-500/60"
                              placeholder="WELCOME100"
                              value={promoCode}
                              onChange={(e) => {
                                setPromoCode(e.target.value.toUpperCase());
                                setPromoError(null);
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (!promoCode.trim()) return;
                                if (promoCode.toUpperCase() !== 'WELCOME100') {
                                  setPromoError('Invalid code');
                                  return;
                                }
                                if (!user) {
                                  setPromoError('Please log in to apply promo code');
                                  return;
                                }
                                setPromoChecking(true);
                                setPromoError(null);
                                try {
                                  const res = await fetch('/api/promo/validate', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ customerId: user.uid, promoCode: promoCode.toUpperCase() }),
                                  });
                                  const data = await res.json();
                                  if (data.valid) {
                                    setPromoApplied(true);
                                    showAlert(data.message, 'success');
                                  } else {
                                    setPromoError(data.message);
                                  }
                                } catch {
                                  setPromoError('Failed to validate. Try again.');
                                } finally {
                                  setPromoChecking(false);
                                }
                              }}
                              disabled={!promoCode.trim() || promoChecking}
                            >
                              {promoChecking ? '...' : 'Apply'}
                            </Button>
                          </div>
                          {promoError && (
                            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-red-400">
                              {promoError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-chalk-400">
                      <Clock className="mx-auto mb-3 h-7 w-7 opacity-50" />
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em]">
                        Pick a matchday &amp; slots
                      </p>
                    </div>
                  )}
              </div>

              {/* perforation — punched notches + dashed tear */}
              <div className="relative">
                <span className="absolute left-[-9px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-pitch-900" />
                <span className="absolute right-[-9px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-pitch-900" />
                <div className="mx-4 border-t border-dashed border-pitchline" />
              </div>

              {/* stub footer — barcode strip, total, the ONE lime action */}
              <div className="space-y-4 px-6 py-5">
                <div className="flex items-end justify-between">
                  <div>
                    <div
                      aria-hidden
                      className="h-8 w-36 opacity-40"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(90deg, rgba(243,247,241,0.7) 0 2px, transparent 2px 5px, rgba(243,247,241,0.7) 5px 6px, transparent 6px 11px, rgba(243,247,241,0.7) 11px 12px, transparent 12px 15px)',
                      }}
                    />
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-chalk-400/70">
                      OutFyld · {turfId.slice(-8)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                      Total
                    </p>
                    <p className="font-mono text-2xl tracking-tight text-flood-500">
                      ₹<OdometerText value={selectedSlotsTotal} />
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="nm-overline inline-flex w-full items-center justify-center gap-2 rounded-[4px] bg-flood-500 px-6 py-4 text-pitch-900 transition-[transform,box-shadow,background-color,opacity] duration-200 ease-night hover:bg-flood-600 hover:shadow-flood active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-35"
                  disabled={selectedSlots.length === 0 || !selectedDate || slotVerificationLoading}
                  onClick={(e) => {
                    e.preventDefault();
                    handleProceedToPayment();
                  }}
                >
                  {slotVerificationLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying availability…
                    </>
                  ) : (
                    <>
                      Proceed to payment
                      {selectedSlots.length > 0 && (
                        <span className="font-mono tabular-nums">
                          ({selectedSlots.length})
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
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
          promoCode={promoApplied ? 'WELCOME100' : undefined}
          promoDiscountAmount={promoApplied ? Math.min(100, Math.max(0, (turf.pricing * selectedSlots.length) - dynamicDiscountAmount)) : 0}
          dynamicDiscountAmount={dynamicDiscountAmount}
          onSuccess={handleBookingSuccess}
          paymentTimer={paymentModalTimer}
        />
      )}
    </div>
  );
});

export default TurfDetailsPage;