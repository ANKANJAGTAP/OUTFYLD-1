'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightShell } from '@/components/night/NightShell';
import { SquadSelector } from '@/components/night/SquadSelector';
import { Mono, StatusDot, SweepButton } from '@/components/night/ui';
import {
  MapPin, Clock, Loader2, MessageSquare, RotateCcw, ChevronDown, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────────────

interface BookingRaw {
  _id: string;
  turfId: any;
  status: string;
  totalAmount: number;
  promoDiscountAmount?: number;
  dynamicDiscountAmount?: number;
  loyaltyDiscountAmount?: number;
  paymentStatus: string;
  slot: {
    date: string;
    startTime: string;
    endTime: string;
    day: string;
  };
  createdAt: string;
}

interface BookingDisplay {
  id: string;
  turfId: string;
  turfName: string;
  location: string;
  date: string;
  day: string;
  time: string;
  status: 'confirmed' | 'completed' | 'pending' | 'pending_payment' | 'cancelled';
  amount: number;
  sport: string;
  createdAt: string;
}

interface BookingStats {
  total: number;
  confirmed: number;
  completed: number;
  pending: number;
  cancelled: number;
  totalSpent: number;
  upcoming: number;
}

type FilterStatus = 'all' | 'confirmed' | 'completed' | 'pending' | 'cancelled';

const STATUS: Record<string, { label: string; tone: 'lime' | 'chalk' | 'red' }> = {
  confirmed: { label: 'Confirmed', tone: 'lime' },
  completed: { label: 'Completed', tone: 'lime' },
  pending: { label: 'Pending', tone: 'chalk' },
  pending_payment: { label: 'Payment due', tone: 'chalk' },
  cancelled: { label: 'Cancelled', tone: 'red' },
};

// ─── Season record row with inline expanding ticket stub ────────────

function RecordRow({
  booking,
  expanded,
  onToggle,
}: {
  booking: BookingDisplay;
  expanded: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const status = STATUS[booking.status] || STATUS.pending;
  const isCompleted = booking.status === 'completed';
  const d = booking.date ? new Date(booking.date + 'T00:00:00') : null;

  return (
    <div className="border-b border-pitchline/60 transition-colors duration-200 ease-night last:border-0 hover:bg-white/[0.02]">
      <button
        onClick={onToggle}
        className="group flex w-full items-center gap-4 px-4 py-4 text-left sm:gap-5 sm:px-6"
        aria-expanded={expanded}
      >
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
              <span className="max-w-40 truncate normal-case tracking-normal">
                {booking.location}
              </span>
            </span>
            {booking.amount > 0 && (
              <Mono className="text-chalk-100">₹{booking.amount.toLocaleString('en-IN')}</Mono>
            )}
          </div>
        </div>

        <span className="flex shrink-0 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-400">
          <StatusDot tone={status.tone} />
          <span className="hidden sm:inline">{status.label}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-flood-500 transition-transform duration-300 ease-night ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* inline mini ticket stub — 250ms height ease */}
      <div
        className={`grid transition-[grid-template-rows] duration-[250ms] ease-night ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="mx-4 mb-4 sm:mx-6 sm:ml-20">
            <div className="relative max-w-md overflow-hidden rounded-[4px] border border-pitchline bg-pitch-800/70">
              <div className="px-5 pb-4 pt-4">
                <p className="nm-overline text-flood-500">Match ticket</p>
                <div className="mt-3 grid grid-cols-2 gap-y-2 font-mono text-xs tabular-nums">
                  <span className="uppercase tracking-[0.1em] text-chalk-400">Date</span>
                  <span className="text-right text-chalk-100">
                    {d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                  <span className="uppercase tracking-[0.1em] text-chalk-400">Slot</span>
                  <span className="text-right text-chalk-100">{booking.time}</span>
                  <span className="uppercase tracking-[0.1em] text-chalk-400">Status</span>
                  <span className="text-right uppercase text-chalk-100">{status.label}</span>
                  <span className="uppercase tracking-[0.1em] text-chalk-400">Paid</span>
                  <span className="text-right text-flood-500">
                    ₹{booking.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              {/* perforation */}
              <div className="relative">
                <span className="absolute left-[-8px] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-pitch-900" />
                <span className="absolute right-[-8px] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-pitch-900" />
                <div className="mx-3 border-t border-dashed border-pitchline" />
              </div>
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <Link
                  href={`/bookings/${booking.id}`}
                  className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-flood-500 transition-colors hover:text-flood-600"
                >
                  Full details
                  <ArrowRight className="h-3 w-3" />
                </Link>
                {isCompleted && (
                  <>
                    <Link
                      href={`/feedback/${booking.id}`}
                      className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400 transition-colors hover:text-chalk-100"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Review
                    </Link>
                    <span className="ml-auto">
                      <SweepButton
                        onClick={() => router.push(`/book/${booking.turfId}`)}
                        className="!px-4 !py-2 text-[10px]"
                      >
                        <span className="flex items-center gap-1.5">
                          <RotateCcw className="h-3 w-3" />
                          Book again
                        </span>
                      </SweepButton>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Bookings — THE SEASON RECORD ───────────────────────────────

function PlayerBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bookings/customer/${user.uid}?limit=100`);
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

  const { displayBookings, stats } = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    let total = 0;
    let confirmed = 0;
    let completed = 0;
    let pending = 0;
    let cancelled = 0;
    let totalSpent = 0;
    let upcoming = 0;

    const transformed: BookingDisplay[] = bookings.map((b) => {
      let displayStatus = b.status as BookingDisplay['status'];
      const isPast = b.slot?.date && b.slot.date < todayStr;

      if (b.status === 'confirmed' && isPast) {
        displayStatus = 'completed';
      }
      if (b.status === 'pending_payment') {
        displayStatus = 'pending_payment';
      }

      total++;
      if (displayStatus === 'confirmed') {
        confirmed++;
        upcoming++;
      }
      if (displayStatus === 'completed') completed++;
      if (displayStatus === 'pending' || displayStatus === 'pending_payment') pending++;
      if (displayStatus === 'cancelled') cancelled++;
      if (b.status === 'confirmed' || b.paymentStatus === 'paid') {
        const netAmount =
          (b.totalAmount || 0) -
          (b.promoDiscountAmount || 0) -
          (b.dynamicDiscountAmount || 0) -
          (b.loyaltyDiscountAmount || 0);
        totalSpent += netAmount;
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
        createdAt: b.createdAt,
      };
    });

    transformed.sort((a, b) => {
      const aUpcoming = a.status === 'confirmed';
      const bUpcoming = b.status === 'confirmed';
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;
      if (aUpcoming && bUpcoming) return a.date.localeCompare(b.date);
      return b.date.localeCompare(a.date);
    });

    const filtered =
      statusFilter === 'all'
        ? transformed
        : transformed.filter((b) => {
            if (statusFilter === 'pending') {
              return b.status === 'pending' || b.status === 'pending_payment';
            }
            return b.status === statusFilter;
          });

    return {
      displayBookings: filtered,
      stats: { total, confirmed, completed, pending, cancelled, totalSpent, upcoming } as BookingStats,
    };
  }, [bookings, statusFilter]);

  if (!user) return null;

  if (loading) {
    return (
      <NightShell ambient={0.6}>
        <LandingHeader />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-7 w-7 animate-spin text-flood-500" />
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-400">
              Pulling the season record…
            </p>
          </div>
        </div>
      </NightShell>
    );
  }

  // season timeline segments (proportional, lime = completed)
  const segments = [
    { key: 'completed', count: stats.completed, cls: 'bg-flood-500' },
    { key: 'confirmed', count: stats.confirmed, cls: 'bg-chalk-100/70' },
    { key: 'pending', count: stats.pending, cls: 'bg-chalk-400/40' },
    { key: 'cancelled', count: stats.cancelled, cls: 'bg-red-900/70' },
  ].filter((s) => s.count > 0);

  return (
    <NightShell ambient={0.6}>
      <LandingHeader />

      <section className="mx-auto max-w-5xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <p className="nm-overline mb-3 text-chalk-400">The season record</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="nm-display-l text-chalk-100">Your fixtures</h1>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-chalk-400">
            <span className="text-chalk-100">{stats.total}</span> played &amp; booked ·{' '}
            <span className="text-flood-500">₹{stats.totalSpent.toLocaleString('en-IN')}</span> spent
          </p>
        </div>

        {/* SEASON TIMELINE — segmented hairline bar, mono counts above */}
        {stats.total > 0 && (
          <div className="mt-8">
            <div className="mb-2 flex gap-4 font-mono text-[9px] uppercase tracking-[0.14em] text-chalk-400">
              <span>
                <span className="text-flood-500">{stats.completed}</span> completed
              </span>
              <span>
                <span className="text-chalk-100">{stats.confirmed}</span> upcoming
              </span>
              {stats.pending > 0 && <span>{stats.pending} pending</span>}
              {stats.cancelled > 0 && <span>{stats.cancelled} cancelled</span>}
            </div>
            <div className="flex h-[3px] w-full gap-[3px] overflow-hidden">
              {segments.map((s) => (
                <div
                  key={s.key}
                  className={`${s.cls} transition-all duration-500 ease-night`}
                  style={{ width: `${(s.count / stats.total) * 100}%` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* status tabs — sliding lime underline */}
        <SquadSelector
          className="mt-8"
          options={[
            { label: `All (${stats.total})`, value: 'all' },
            { label: `Upcoming (${stats.confirmed})`, value: 'confirmed' },
            { label: `Completed (${stats.completed})`, value: 'completed' },
            { label: `Pending (${stats.pending})`, value: 'pending' },
            { label: `Cancelled (${stats.cancelled})`, value: 'cancelled' },
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as FilterStatus)}
        />
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/80">
          {displayBookings.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h3 className="font-display text-2xl uppercase tracking-tight text-chalk-100">
                Nothing in this column
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-chalk-400">
                {statusFilter === 'all'
                  ? 'Book your first game and start the record.'
                  : 'No fixtures with this status yet.'}
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
            displayBookings.map((booking) => (
              <RecordRow
                key={booking.id}
                booking={booking}
                expanded={expandedId === booking.id}
                onToggle={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
              />
            ))
          )}
        </div>
      </section>
    </NightShell>
  );
}

export default function PlayerBookingsPage() {
  return (
    <ProtectedRoute requireRole="customer">
      <PlayerBookings />
    </ProtectedRoute>
  );
}
