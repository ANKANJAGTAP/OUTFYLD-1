'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightShell } from '@/components/night/NightShell';
import { CountUp } from '@/components/landing/night-match/CountUp';
import { Mono, StatusDot } from '@/components/night/ui';
import {
  MapPin, Clock, User, Search, History, Trophy, ChevronRight,
  Loader2, MessageSquare, ArrowRight, Heart,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────

interface PlayerStats {
  totalBookings: number;
  completedGames: number;
  upcomingGames: number;
  cancelledBookings: number;
  totalSpent: number;
  loyaltyPoints: number;
  favoriteSpots: number;
}

export interface BookingItem {
  id: string;
  turfId: string;
  turfName: string;
  location: string;
  date: string;
  day: string;
  time: string;
  status: 'confirmed' | 'completed' | 'pending' | 'cancelled' | 'pending_payment';
  amount: number;
  sport: string;
}

// ─── Status → dot + overline (no pills) ─────────────────────────────

const STATUS: Record<string, { label: string; tone: 'lime' | 'chalk' | 'red' }> = {
  confirmed: { label: 'Confirmed', tone: 'lime' },
  completed: { label: 'Completed', tone: 'lime' },
  pending: { label: 'Pending', tone: 'chalk' },
  pending_payment: { label: 'Payment due', tone: 'chalk' },
  cancelled: { label: 'Cancelled', tone: 'red' },
};

// ─── Fixture history row ────────────────────────────────────────────

export function FixtureRow({ booking }: { booking: BookingItem }) {
  const status = STATUS[booking.status] || STATUS.pending;
  const isCompleted =
    booking.status === 'completed' ||
    (booking.status === 'confirmed' && new Date(booking.date) < new Date());
  const d = booking.date ? new Date(booking.date + 'T00:00:00') : null;

  return (
    <div className="group flex items-center gap-4 border-b border-pitchline/60 px-4 py-4 transition-colors duration-200 ease-night last:border-0 hover:bg-white/[0.03] sm:gap-5 sm:px-6">
      {/* compact mono date block */}
      <div className="w-11 shrink-0 text-center">
        <span className="block font-mono text-xl leading-none tabular-nums text-chalk-100">
          {d ? d.getDate() : '—'}
        </span>
        <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.18em] text-flood-500">
          {d ? d.toLocaleDateString('en-US', { month: 'short' }) : ''}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg uppercase leading-tight tracking-tight text-chalk-100 transition-colors duration-200 group-hover:text-flood-500">
          {booking.turfName}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {booking.time}
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            <MapPin className="h-3 w-3" />
            <span className="max-w-40 truncate normal-case tracking-normal">{booking.location}</span>
          </span>
          {booking.amount > 0 && <Mono className="text-chalk-100">₹{booking.amount.toLocaleString('en-IN')}</Mono>}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-400">
          <StatusDot tone={status.tone} />
          {status.label}
        </span>
        {isCompleted && (
          <Link
            href={`/feedback/${booking.id}`}
            className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-flood-500/80 transition-colors hover:text-flood-500"
          >
            <MessageSquare className="h-3 w-3" />
            Review
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Main Player Dashboard — THE PLAYER'S TUNNEL ─────────────────────

function PlayerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  // count-up runs once per session so route changes don't recount
  const [counted, setCounted] = useState(true);

  useEffect(() => {
    setCounted(sessionStorage.getItem('nm-season-stats') === '1');
    sessionStorage.setItem('nm-season-stats', '1');
  }, []);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [bookingsRes, loyaltyRes] = await Promise.all([
          fetch(`/api/bookings/customer/${uid}?limit=5`),
          fetch(`/api/loyalty/customer/${uid}`),
        ]);

        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          setBookings(data.bookings || []);
          setTotalBookingsCount(data.pagination?.totalItems || 0);
        }

        if (loyaltyRes.ok) {
          const data = await loyaltyRes.json();
          if (data.success && data.data) {
            setLoyaltyPoints(data.data.currentPoints || 0);
          }
        }
      } catch (error) {
        console.error('Failed to fetch player dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.uid]);

  const stats = useMemo((): PlayerStats => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    let completedGames = 0;
    let upcomingGames = 0;
    let cancelledBookings = 0;
    let totalSpent = 0;

    for (const b of bookings) {
      const isConfirmed = b.status === 'confirmed';
      const isPast = b.slot?.date && b.slot.date < todayStr;
      const isFuture = b.slot?.date && b.slot.date >= todayStr;

      if (isConfirmed && isPast) completedGames++;
      if (isConfirmed && isFuture) upcomingGames++;
      if (b.status === 'cancelled') cancelledBookings++;
      if (isConfirmed || b.paymentStatus === 'paid') {
        const netAmount =
          (b.totalAmount || 0) -
          (b.promoDiscountAmount || 0) -
          (b.dynamicDiscountAmount || 0) -
          (b.loyaltyDiscountAmount || 0);
        totalSpent += netAmount;
      }
    }

    return {
      totalBookings: totalBookingsCount,
      completedGames,
      upcomingGames,
      cancelledBookings,
      totalSpent,
      loyaltyPoints,
      favoriteSpots: 0,
    };
  }, [bookings, totalBookingsCount, loyaltyPoints]);

  const recentBookings = useMemo((): BookingItem[] => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    return bookings.slice(0, 5).map((b: any) => {
      let displayStatus = b.status;
      if (b.status === 'confirmed' && b.slot?.date && b.slot.date < todayStr) {
        displayStatus = 'completed';
      }

      return {
        id: b._id,
        turfId: b.turfId?._id || '',
        turfName:
          b.turfId?.name ||
          b.turfId?.businessName ||
          b.turfId?.contactInfo?.businessName ||
          'Unknown Arena',
        location:
          b.turfId?.location?.city ||
          b.turfId?.location?.address ||
          'Location unavailable',
        date: b.slot?.date || '',
        day: b.slot?.day || '',
        time: `${b.slot?.startTime || ''} - ${b.slot?.endTime || ''}`,
        status: displayStatus,
        amount:
          (b.totalAmount || 0) -
          (b.promoDiscountAmount || 0) -
          (b.dynamicDiscountAmount || 0) -
          (b.loyaltyDiscountAmount || 0),
        sport: b.turfId?.sportsOffered?.[0] || 'Sports',
      };
    });
  }, [bookings]);

  if (!user) return null;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  if (loading) {
    return (
      <NightShell ambient={0.6}>
        <LandingHeader />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-7 w-7 animate-spin text-flood-500" />
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-400">
              Walking the tunnel…
            </p>
          </div>
        </div>
      </NightShell>
    );
  }

  const seasonStats = [
    { label: 'Total bookings', value: stats.totalBookings },
    { label: 'Completed', value: stats.completedGames },
    { label: 'Upcoming', value: stats.upcomingGames },
    { label: 'Points', value: stats.loyaltyPoints },
    { label: 'Spent', value: stats.totalSpent, prefix: '₹' },
    { label: 'Cancelled', value: stats.cancelledBookings },
  ];

  return (
    <NightShell ambient={0.6}>
      <LandingHeader />

      {/* ── greeting — Anton, lime pitch-line drawn under the name ── */}
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="nm-overline mb-3 text-chalk-400">The player&apos;s tunnel</p>
            <h1 className="nm-display-l text-chalk-100">
              {greeting},{' '}
              <span className="relative inline-block">
                {user.name?.split(' ')[0]}
                <span
                  className="absolute -bottom-2 left-0 h-[2px] w-full origin-left -rotate-[1.5deg] bg-flood-500 shadow-flood motion-safe:animate-[nm-underline_0.7s_cubic-bezier(0.16,1,0.3,1)_0.3s_backwards]"
                  aria-hidden
                />
              </span>
            </h1>
          </div>
          <Link
            href="/browse"
            className="nm-overline inline-flex shrink-0 items-center gap-2 rounded-[4px] bg-flood-500 px-6 py-3.5 text-pitch-900 transition-[transform,box-shadow] duration-200 ease-night hover:shadow-flood active:translate-y-[2px]"
          >
            <Search className="h-4 w-4" />
            Find arenas
          </Link>
        </div>
      </section>

      {/* ── SEASON STATS — one strip, hairline separators, scoreboard digits ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-y-8 rounded-[4px] border border-pitchline bg-pitch-700/80 px-6 py-7 lg:grid-cols-6 lg:divide-x lg:divide-pitchline/60">
          {seasonStats.map((s, i) => (
            <div key={s.label} className={i > 0 ? 'lg:pl-7' : ''}>
              <div className="font-mono text-2xl tabular-nums tracking-tight text-chalk-100 sm:text-3xl">
                {s.prefix || ''}
                {counted ? (
                  s.value.toLocaleString('en-IN')
                ) : (
                  <CountUp value={s.value} />
                )}
              </div>
              <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-400">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── main grid ── */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-3 lg:px-8">
        {/* FIXTURE HISTORY */}
        <div className="overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/80 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-pitchline/60 px-6 py-4">
            <p className="nm-overline text-chalk-400">Fixture history</p>
            <Link
              href="/dashboard/player/bookings"
              className="group flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-flood-500"
            >
              View all
              <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 ease-night group-hover:translate-x-1" />
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h3 className="font-display text-2xl uppercase tracking-tight text-chalk-100">
                No fixtures yet
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-chalk-400">
                Browse arenas near you and book your first game.
              </p>
              <Link
                href="/browse"
                className="nm-overline mt-6 inline-flex items-center gap-2 rounded-[4px] border border-chalk-400/30 px-5 py-3 text-chalk-100 transition-colors duration-200 ease-night hover:border-flood-500 hover:text-flood-500"
              >
                Browse arenas
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div>
              {recentBookings.map((booking) => (
                <FixtureRow key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>

        {/* right rail */}
        <div className="space-y-6">
          {/* quick actions — dark rows, lime chevron nudge */}
          <div className="overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/80">
            <div className="border-b border-pitchline/60 px-6 py-4">
              <p className="nm-overline text-chalk-400">Quick actions</p>
            </div>
            <div>
              {[
                { icon: <History className="h-4 w-4" />, label: 'Booking history', desc: 'The season record', href: '/dashboard/player/bookings' },
                { icon: <Trophy className="h-4 w-4" />, label: 'Rewards & points', desc: `${loyaltyPoints.toLocaleString('en-IN')} points available`, href: '/dashboard/player/loyalty' },
                { icon: <User className="h-4 w-4" />, label: 'My profile', desc: 'Player card & settings', href: '/dashboard/player/profile' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3.5 border-b border-pitchline/60 px-6 py-4 transition-colors duration-200 ease-night last:border-0 hover:bg-white/[0.03]"
                >
                  <span className="text-flood-500">{item.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-100">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] text-chalk-400">{item.desc}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-flood-500 transition-transform duration-200 ease-night group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>

          {/* loyalty promo — THE one glowing element */}
          <Link
            href="/dashboard/player/loyalty"
            className="block rounded-[4px] border border-flood-500/50 bg-pitch-700/90 p-6 shadow-flood transition-[box-shadow,border-color] duration-300 ease-night hover:border-flood-500"
          >
            <p className="nm-overline flex items-center gap-2 text-flood-500">
              <Trophy className="h-4 w-4" />
              Loyalty rewards
            </p>
            <p className="mt-4 font-mono text-4xl tabular-nums tracking-tight text-chalk-100">
              {loyaltyPoints.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
              Points available
            </p>
            <p className="mt-4 border-t border-pitchline/60 pt-4 text-xs leading-relaxed text-chalk-400">
              Earn points with every booking. Redeem them for discounts on future games.
            </p>
          </Link>

          {/* favorites placeholder */}
          <div className="rounded-[4px] border border-pitchline bg-pitch-700/60 px-6 py-5">
            <p className="nm-overline flex items-center gap-2 text-chalk-400">
              <Heart className="h-3.5 w-3.5" />
              Favourite arenas
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400/60">
              Coming soon
            </p>
          </div>
        </div>
      </div>
    </NightShell>
  );
}

export default function PlayerDashboardPage() {
  return (
    <ProtectedRoute requireRole="customer">
      <PlayerDashboard />
    </ProtectedRoute>
  );
}
