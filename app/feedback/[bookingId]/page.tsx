'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Star, Loader2, CheckCircle2, MapPin, Calendar,
  Clock, ChevronRight, Search, ArrowRight, MessageSquare,
  Sparkles, AlertCircle,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightFooter } from '@/components/landing/night-match/NightFooter';
import Link from 'next/link';

interface FeedbackPageProps {
  params: Promise<{
    bookingId: string;
  }>;
}

// ─── Rating Labels ───────────────────────────────────────────────────

const RATING_CONFIG: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: 'Poor', emoji: '😞', color: 'text-red-500' },
  2: { label: 'Fair', emoji: '😕', color: 'text-orange-500' },
  3: { label: 'Good', emoji: '😊', color: 'text-amber-500' },
  4: { label: 'Very Good', emoji: '😄', color: 'text-green-500' },
  5: { label: 'Excellent', emoji: '🤩', color: 'text-emerald-600' },
};

export default function FeedbackPage(props: FeedbackPageProps) {
  const params = use(props.params);
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [fetchingBooking, setFetchingBooking] = useState(true);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setFetchingBooking(true);
        const response = await fetch(`/api/bookings/${params.bookingId}`);
        if (response.ok) {
          const data = await response.json();
          setBooking(data.booking);
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setFetchingBooking(false);
      }
    };

    fetchBookingDetails();
  }, [params.bookingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: params.bookingId,
          rating,
          review: review.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      setSubmitted(true);
      setTimeout(() => router.push('/'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const activeRating = hoverRating || rating;
  const ratingInfo = RATING_CONFIG[activeRating];

  // ── Success State ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <LandingHeader />

        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="max-w-md w-full text-center">
            {/* Success icon */}
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-200" />
              <div className="absolute -bottom-2 -left-2 w-3 h-3 rounded-full bg-teal-200" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
            <p className="text-gray-500 mt-2 leading-relaxed">
              Your feedback has been submitted successfully. We appreciate you
              taking the time to share your experience!
            </p>

            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: rating }).map((_, i) => (
                <Star
                  key={i}
                  className="h-6 w-6 fill-amber-400 text-amber-400"
                />
              ))}
            </div>

            <p className="text-xs text-gray-400 mt-6">
              Redirecting to home page...
            </p>

            <Link href="/" className="mt-4 inline-block">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 h-9 px-5 text-xs font-medium"
              >
                Go to Home
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        <NightFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <LandingHeader />

      {/* ─────────── HERO BANNER ─────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 sm:pb-24">
          <Link
            href="/dashboard/player"
            className="text-sm text-white/70 hover:text-white flex items-center gap-1.5 transition-colors duration-200 mb-4"
          >
            ← Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Rate Your Experience
            </h1>
            <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 text-[10px]">
              <MessageSquare className="h-3 w-3 mr-1" />
              Feedback
            </Badge>
          </div>
          <p className="text-emerald-200 text-sm">
            {booking
              ? `How was your experience at ${booking.turf?.name || booking.turfId?.name || 'the turf'}?`
              : 'Tell us about your experience'}
          </p>
        </div>
      </div>

      {/* ─────────── CONTENT ─────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-12">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">

            {/* ── Booking Details (if available) ── */}
            {fetchingBooking ? (
              <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-400">Loading booking details...</span>
              </div>
            ) : booking ? (
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px]">
                      Booking Details
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Your completed session
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                        Turf
                      </p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {booking.turf?.name ||
                          booking.turfId?.name ||
                          booking.turfId?.contactInfo?.businessName ||
                          'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                        Date
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.slot?.date ||
                          (booking.bookingDate
                            ? new Date(booking.bookingDate).toLocaleDateString()
                            : 'N/A')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                        Time
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.slot
                          ? `${booking.slot.startTime} - ${booking.slot.endTime}`
                          : booking.timeSlot || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ── Rating Section ── */}
            <div className="px-6 py-6 sm:py-8">

              {/* Error */}
              {error && (
                <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Star Rating */}
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">
                  How was your experience?
                </h3>
                <p className="text-sm text-gray-400 mb-6">
                  Tap a star to rate
                </p>

                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setRating(star);
                        setError('');
                      }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-all duration-200 hover:scale-125 active:scale-95 focus:outline-none"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors duration-200 ${
                          star <= activeRating
                            ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                            : 'text-gray-200 hover:text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Rating label */}
                <div className="h-8 mt-3 flex items-center justify-center">
                  {ratingInfo && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${ratingInfo.color} bg-gray-50`}
                    >
                      <span className="text-base">{ratingInfo.emoji}</span>
                      {ratingInfo.label}
                    </span>
                  )}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Review Text */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-900">
                    Your Review
                    <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {review.length}/500
                  </span>
                </div>
                <Textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your experience... What did you like? What could be improved?"
                  rows={4}
                  maxLength={500}
                  className="
                    resize-none rounded-xl border-gray-200
                    text-sm placeholder:text-gray-400
                    focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100
                    transition-all duration-200
                  "
                />

                {/* Quick suggestion chips */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    'Great arena quality',
                    'Well maintained',
                    'Friendly staff',
                    'Good facilities',
                    'Value for money',
                    'Easy booking',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        const newReview = review
                          ? `${review}. ${chip}`
                          : chip;
                        if (newReview.length <= 500) setReview(newReview);
                      }}
                      className="
                        px-3 py-1.5 rounded-lg text-[11px] font-medium
                        bg-gray-50 text-gray-600 border border-gray-200
                        hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200
                        transition-all duration-200
                      "
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/player')}
                className="
                  flex-1 rounded-xl border-gray-200 text-gray-600
                  hover:bg-gray-100 h-11 font-medium
                  transition-all duration-200
                "
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || rating === 0}
                className="
                  flex-1 rounded-xl h-11 font-semibold
                  bg-emerald-600 hover:bg-emerald-700 text-white
                  shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300
                  disabled:opacity-50 disabled:shadow-none
                  transition-all duration-200
                "
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* ── Bottom CTA ── */}
        <div className="mt-5">
          <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl p-6 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '20px 20px',
              }}
            />
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Ready for another game?
                </h3>
                <p className="text-emerald-100 text-sm mt-1">
                  Browse arenas near you and book your next session.
                </p>
              </div>
              <Link href="/browse">
                <Button
                  size="sm"
                  className="bg-white text-emerald-700 hover:bg-gray-100 rounded-xl h-10 px-5 font-semibold shadow-xl transition-all duration-200"
                >
                  <Search className="h-4 w-4 mr-1.5" />
                  Browse Arenas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <NightFooter />
    </div>
  );
}