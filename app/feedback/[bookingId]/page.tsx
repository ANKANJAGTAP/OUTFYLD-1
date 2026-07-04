'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Star, Loader2, MapPin, Calendar, Clock, ArrowRight, Search,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightFooter } from '@/components/landing/night-match/NightFooter';
import { NightShell } from '@/components/night/NightShell';
import { Reveal } from '@/components/landing/night-match/Reveal';
import {
  nightCard,
  nightPrimaryBtn,
  nightGhostBtn,
  NightTextarea,
  NightSkeleton,
  Overline,
  StatusDot,
  Mono,
} from '@/components/night/ui';
import Link from 'next/link';

interface FeedbackPageProps {
  params: Promise<{
    bookingId: string;
  }>;
}

// ─── Rating Labels — the referee's verdict ───────────────────────────

const RATING_CONFIG: Record<number, { label: string }> = {
  1: { label: 'Poor' },
  2: { label: 'Fair' },
  3: { label: 'Good' },
  4: { label: 'Very good' },
  5: { label: 'Excellent' },
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
      <NightShell ambient={0.55}>
        <LandingHeader />

        <main className="flex min-h-[70vh] items-center px-4 sm:px-6">
          <div className="mx-auto w-full max-w-md">
            <Overline tone="lime">
              <StatusDot tone="lime" />
              <span className="ml-1">Report filed</span>
            </Overline>
            <h2 className="nm-display-l mt-3 text-chalk-100">Full time</h2>
            <p className="mt-4 text-sm leading-relaxed text-chalk-400">
              Your post-match report has been submitted. We appreciate you
              taking the time to share your experience.
            </p>

            <div className="mt-6 flex items-center gap-2">
              {Array.from({ length: rating }).map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-flood-500 text-flood-500" />
              ))}
            </div>

            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-chalk-400">
              Heading back to the tunnel…
            </p>

            <Link href="/" className={`${nightGhostBtn} mt-4`}>
              Go to home
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </main>

        <NightFooter />
      </NightShell>
    );
  }

  return (
    <NightShell ambient={0.55}>
      <LandingHeader />

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        {/* ─────────── MASTHEAD ─────────── */}
        <Reveal>
          <Link
            href="/dashboard/player"
            className="nm-overline mb-8 inline-flex items-center gap-2 text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
          >
            ← Dashboard
          </Link>
          <Overline tone="lime" className="block">Post-match report</Overline>
          <h1 className="nm-display-l mt-3 text-chalk-100">Rate the ground</h1>
          <p className="mt-4 text-sm text-chalk-400">
            {booking
              ? `How was your match at ${booking.turf?.name || booking.turfId?.name || 'the turf'}?`
              : 'Tell us how the fixture went.'}
          </p>
        </Reveal>

        {/* ─────────── REPORT FORM ─────────── */}
        <Reveal delay={0.08} className="mt-10">
          <form onSubmit={handleSubmit}>
            <div className={`${nightCard} overflow-hidden`}>
              {/* ── Booking Details (if available) ── */}
              {fetchingBooking ? (
                <div className="space-y-2 border-b border-pitchline/60 px-6 py-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-chalk-400">
                    Pulling the match sheet…
                  </p>
                  <NightSkeleton className="h-10 w-full rounded-[3px]" />
                </div>
              ) : booking ? (
                <div className="border-b border-pitchline/60 px-6 py-5">
                  <p className="nm-overline mb-4 text-chalk-400">The fixture</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-[3px] border border-pitchline/70 bg-pitch-800/60 p-3">
                      <MapPin className="h-4 w-4 shrink-0 text-flood-500" />
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                          Ground
                        </p>
                        <p className="truncate text-sm text-chalk-100">
                          {booking.turf?.name ||
                            booking.turfId?.name ||
                            booking.turfId?.contactInfo?.businessName ||
                            'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-[3px] border border-pitchline/70 bg-pitch-800/60 p-3">
                      <Calendar className="h-4 w-4 shrink-0 text-flood-500" />
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                          Matchday
                        </p>
                        <Mono className="block truncate text-sm text-chalk-100">
                          {booking.slot?.date ||
                            (booking.bookingDate
                              ? new Date(booking.bookingDate).toLocaleDateString()
                              : 'N/A')}
                        </Mono>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-[3px] border border-pitchline/70 bg-pitch-800/60 p-3">
                      <Clock className="h-4 w-4 shrink-0 text-flood-500" />
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                          Kick-off
                        </p>
                        <Mono className="block truncate text-sm text-chalk-100">
                          {booking.slot
                            ? `${booking.slot.startTime} - ${booking.slot.endTime}`
                            : booking.timeSlot || 'N/A'}
                        </Mono>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ── Rating Section ── */}
              <div className="px-6 py-6 sm:py-8">
                {/* Error */}
                {error && (
                  <div className="mb-6 rounded-[4px] border border-red-900/60 bg-red-950/20 px-4 py-3">
                    <p className="font-mono text-xs uppercase tracking-[0.1em] text-red-200">
                      {error}
                    </p>
                  </div>
                )}

                {/* Star Rating */}
                <div>
                  <p className="nm-overline text-chalk-400">The verdict</p>
                  <h3 className="mt-2 font-display text-2xl uppercase tracking-tight text-chalk-100">
                    How was the match?
                  </h3>

                  <div className="mt-6 flex items-center gap-2 sm:gap-3">
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
                        className="transition-transform duration-200 ease-night hover:scale-110 focus:outline-none active:scale-95"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`h-10 w-10 transition-colors duration-200 ease-night sm:h-12 sm:w-12 ${
                            star <= activeRating
                              ? 'fill-flood-500 text-flood-500 drop-shadow-[0_0_12px_rgba(200,241,53,0.35)]'
                              : 'text-chalk-400/25 hover:text-chalk-400/50'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Rating label */}
                  <div className="mt-4 flex h-6 items-center gap-3">
                    {ratingInfo && (
                      <>
                        <Mono className="text-sm text-flood-500">{activeRating}/5</Mono>
                        <span className="nm-overline text-chalk-100">
                          {ratingInfo.label}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="my-6 border-t border-pitchline/60" />

                {/* Review Text */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="nm-overline text-chalk-400">
                      Match report{' '}
                      <span className="normal-case tracking-normal text-chalk-400/60">
                        (optional)
                      </span>
                    </label>
                    <Mono className="text-[11px] text-chalk-400">{review.length}/500</Mono>
                  </div>
                  <NightTextarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your experience… What did you like? What could be improved?"
                    rows={4}
                    maxLength={500}
                    className="resize-none"
                  />

                  {/* Quick suggestion chips */}
                  <div className="mt-3 flex flex-wrap gap-2">
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
                          const newReview = review ? `${review}. ${chip}` : chip;
                          if (newReview.length <= 500) setReview(newReview);
                        }}
                        className="rounded-[3px] border border-pitchline bg-pitch-800/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400 transition-[border-color,color] duration-200 ease-night hover:border-flood-500/60 hover:text-flood-500"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Action Buttons ── */}
              <div className="flex flex-col gap-3 border-t border-pitchline/60 bg-pitch-800/40 px-6 py-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/player')}
                  className={`${nightGhostBtn} flex-1`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || rating === 0}
                  className={`${nightPrimaryBtn} flex-1`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>File the report</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </Reveal>

        {/* ── Bottom CTA ── */}
        <Reveal delay={0.14} className="mt-6">
          <div className={`${nightCard} flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center`}>
            <div>
              <p className="nm-overline text-flood-500">Next fixture</p>
              <h3 className="mt-2 font-display text-xl uppercase tracking-tight text-chalk-100">
                Ready for another game?
              </h3>
              <p className="mt-1 text-sm text-chalk-400">
                Browse grounds near you and book your next session.
              </p>
            </div>
            <Link href="/browse" className={`${nightGhostBtn} shrink-0`}>
              <Search className="h-4 w-4" />
              Browse grounds
            </Link>
          </div>
        </Reveal>
      </main>

      <NightFooter />
    </NightShell>
  );
}
