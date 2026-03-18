'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  History, MapPin, Calendar, Clock, Search,
  CheckCircle2, XCircle, IndianRupee, Activity,
  ChevronRight, ArrowRight, Loader2, CalendarCheck,
  Trophy, MessageSquare, RotateCcw, Filter,
  ChevronDown, Sparkles,
} from 'lucide-react';
import Link from 'next/link';

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

// ─── Stat Card ───────────────────────────────────────────────────────

function StatCard({
  icon,
  iconGradient,
  label,
  value,
  subtext,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  iconGradient: string;
  label: string;
  value: string;
  subtext: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`
        group bg-white rounded-2xl border shadow-sm
        p-4 sm:p-5 transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${active
          ? 'border-emerald-300 shadow-lg shadow-emerald-50 ring-1 ring-emerald-200'
          : 'border-gray-100 hover:shadow-lg hover:shadow-emerald-50 hover:border-emerald-100'
        }
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
        {active && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-xs font-medium text-gray-700 mt-1">{label}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{subtext}</p>
    </div>
  );
}

// ─── Booking Card ────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: BookingDisplay }) {
  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    confirmed: {
      label: 'Confirmed',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    completed: {
      label: 'Completed',
      color: 'text-blue-700',
      bg: 'bg-blue-50 border-blue-200',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    pending: {
      label: 'Pending',
      color: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200',
      icon: <Clock className="h-3 w-3" />,
    },
    pending_payment: {
      label: 'Payment Pending',
      color: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200',
      icon: <Clock className="h-3 w-3" />,
    },
    cancelled: {
      label: 'Cancelled',
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-200',
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  const status = statusConfig[booking.status] || statusConfig.pending;
  const isUpcoming = booking.status === 'confirmed';
  const isCompleted = booking.status === 'completed';

  return (
    <div className="group bg-white rounded-xl border border-gray-100 p-4 sm:p-5 hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-50 transition-all duration-300">
      <div className="flex items-start gap-4">
        {/* Date badge */}
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-emerald-50 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-bold text-emerald-700 leading-none">
            {booking.date ? new Date(booking.date + 'T00:00:00').getDate() : '—'}
          </span>
          <span className="text-[10px] font-medium text-emerald-500 uppercase mt-0.5">
            {booking.date
              ? new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })
              : ''}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm truncate group-hover:text-emerald-700 transition-colors">
                {booking.turfName}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{booking.location}</span>
              </div>
            </div>
            <span
              className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.bg} ${status.color}`}
            >
              {status.icon}
              {status.label}
            </span>
          </div>

          {/* Details */}
          <div className="flex flex-wrap items-center gap-3 mt-2.5">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {booking.time}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              {booking.day}
            </span>
            {booking.amount > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                <IndianRupee className="h-3 w-3" />
                {booking.amount.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {isCompleted && (
              <>
                <Link href={`/feedback/${booking.id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg h-7 px-3 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Give Review
                  </Button>
                </Link>
                <Link href={`/bookings/${booking.id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg h-7 px-3 text-[11px] font-medium text-gray-600 hover:bg-gray-100 border-gray-200"
                  >
                    View Details
                  </Button>
                </Link>
                <Link href={`/book/${booking.turfId}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg h-7 px-3 text-[11px] font-medium text-gray-600 hover:bg-gray-100 border-gray-200"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Book Again
                  </Button>
                </Link>
              </>
            )}
            {isUpcoming && (
              <Link href={`/bookings/${booking.id}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg h-7 px-3 text-[11px] font-medium text-gray-600 hover:bg-gray-100 border-gray-200"
                >
                  View Details
                </Button>
              </Link>
            )}
            {!isCompleted && !isUpcoming && (
              <Link href={`/bookings/${booking.id}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg h-7 px-3 text-[11px] font-medium text-gray-600 hover:bg-gray-100 border-gray-200"
                >
                  View Details
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Bookings Component ─────────────────────────────────────────

function PlayerBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  // ── Fetch bookings ──
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

  // ── Transform + compute ──
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

      // Count stats
      total++;
      if (displayStatus === 'confirmed') {
        confirmed++;
        upcoming++;
      }
      if (displayStatus === 'completed') completed++;
      if (displayStatus === 'pending' || displayStatus === 'pending_payment') pending++;
      if (displayStatus === 'cancelled') cancelled++;
      if (b.status === 'confirmed' || b.paymentStatus === 'paid') {
        const netAmount = (b.totalAmount || 0) - (b.promoDiscountAmount || 0) - (b.dynamicDiscountAmount || 0) - (b.loyaltyDiscountAmount || 0);
        totalSpent += netAmount;
      }

      return {
        id: b._id,
        turfId: b.turfId?._id || '',
        turfName:
          b.turfId?.name ||
          b.turfId?.businessName ||
          b.turfId?.contactInfo?.businessName ||
          'Unknown Turf',
        location:
          b.turfId?.location?.city ||
          b.turfId?.location?.address ||
          'Location unavailable',
        date: b.slot?.date || '',
        day: b.slot?.day || '',
        time: `${b.slot?.startTime || ''} - ${b.slot?.endTime || ''}`,
        status: displayStatus,
        amount: (b.totalAmount || 0) - (b.promoDiscountAmount || 0) - (b.dynamicDiscountAmount || 0) - (b.loyaltyDiscountAmount || 0),
        sport: b.turfId?.sportsOffered?.[0] || 'Sports',
        createdAt: b.createdAt,
      };
    });

    // Sort: upcoming first (by date asc), then past (by date desc)
    transformed.sort((a, b) => {
      const aUpcoming = a.status === 'confirmed';
      const bUpcoming = b.status === 'confirmed';
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;
      if (aUpcoming && bUpcoming) return a.date.localeCompare(b.date);
      return b.date.localeCompare(a.date);
    });

    // Apply filter
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

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <LandingHeader />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
            </div>
            <p className="text-gray-500 font-medium">Loading bookings...</p>
            <p className="text-xs text-gray-400 mt-1">Fetching your booking history</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter tabs config
  const filterTabs: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'confirmed', label: 'Upcoming', count: stats.confirmed },
    { key: 'completed', label: 'Completed', count: stats.completed },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'cancelled', label: 'Cancelled', count: stats.cancelled },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <LandingHeader />

      {/* ─────────── HERO BANNER ─────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 sm:pb-24">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5">
            <div>
              <Link
                href="/dashboard/player"
                className="text-sm text-white/70 hover:text-white flex items-center gap-1.5 transition-colors duration-200 mb-4"
              >
                ← Dashboard
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Booking History
                </h1>
                <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 text-[10px]">
                  <History className="h-3 w-3 mr-1" />
                  {stats.total} Total
                </Badge>
              </div>
              <p className="text-emerald-200 text-sm">
                Track all your past and upcoming turf reservations.
              </p>
            </div>

            <Link href="/browse">
              <Button className="bg-white text-emerald-700 hover:bg-gray-100 rounded-xl h-11 px-6 font-semibold shadow-xl transition-all duration-200">
                <Search className="h-4 w-4 mr-2" />
                Book New
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────── CONTENT ─────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-12">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            icon={<CalendarCheck className="h-4 w-4" />}
            iconGradient="from-emerald-500 to-green-600"
            label="Total"
            value={String(stats.total)}
            subtext="All bookings"
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          />
          <StatCard
            icon={<Activity className="h-4 w-4" />}
            iconGradient="from-green-500 to-teal-500"
            label="Upcoming"
            value={String(stats.confirmed)}
            subtext="Confirmed"
            active={statusFilter === 'confirmed'}
            onClick={() => setStatusFilter('confirmed')}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            iconGradient="from-blue-500 to-indigo-500"
            label="Completed"
            value={String(stats.completed)}
            subtext="Games played"
            active={statusFilter === 'completed'}
            onClick={() => setStatusFilter('completed')}
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            iconGradient="from-amber-500 to-orange-500"
            label="Pending"
            value={String(stats.pending)}
            subtext="Awaiting"
            active={statusFilter === 'pending'}
            onClick={() => setStatusFilter('pending')}
          />
          <StatCard
            icon={<XCircle className="h-4 w-4" />}
            iconGradient="from-red-500 to-rose-500"
            label="Cancelled"
            value={String(stats.cancelled)}
            subtext="All-time"
            active={statusFilter === 'cancelled'}
            onClick={() => setStatusFilter('cancelled')}
          />
          <StatCard
            icon={<IndianRupee className="h-4 w-4" />}
            iconGradient="from-teal-500 to-cyan-500"
            label="Spent"
            value={`₹${stats.totalSpent.toLocaleString('en-IN')}`}
            subtext="Total paid"
          />
        </div>

        {/* ── Status Progress Bar ── */}
        {stats.total > 0 && (
          <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Status Overview</h3>
              <span className="text-xs text-gray-400">{stats.total} total</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
              {stats.completed > 0 && (
                <div
                  className="h-full bg-blue-500 transition-all duration-700"
                  style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                />
              )}
              {stats.confirmed > 0 && (
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${(stats.confirmed / stats.total) * 100}%` }}
                />
              )}
              {stats.pending > 0 && (
                <div
                  className="h-full bg-amber-400 transition-all duration-700"
                  style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                />
              )}
              {stats.cancelled > 0 && (
                <div
                  className="h-full bg-red-400 transition-all duration-700"
                  style={{ width: `${(stats.cancelled / stats.total) * 100}%` }}
                />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-5 mt-3">
              {[
                { label: 'Completed', count: stats.completed, color: 'bg-blue-500' },
                { label: 'Upcoming', count: stats.confirmed, color: 'bg-emerald-500' },
                { label: 'Pending', count: stats.pending, color: 'bg-amber-400' },
                { label: 'Cancelled', count: stats.cancelled, color: 'bg-red-400' },
              ]
                .filter((s) => s.count > 0)
                .map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <span className="text-xs text-gray-500">{s.label} ({s.count})</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Filter Tabs ── */}
        <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="px-4 sm:px-6 py-3 border-b border-gray-50 flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`
                  flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium
                  whitespace-nowrap transition-all duration-200
                  ${statusFilter === tab.key
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }
                `}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                    statusFilter === tab.key
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Booking list */}
          <div className="p-3 sm:p-4 space-y-3">
            {displayBookings.length > 0 ? (
              displayBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <div className="text-center py-14 px-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-7 w-7 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  {statusFilter === 'all'
                    ? 'No bookings yet'
                    : `No ${statusFilter} bookings`}
                </h3>
                <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto">
                  {statusFilter === 'all'
                    ? 'Start by browsing turfs near you and booking your first game!'
                    : 'Try selecting a different filter to see more bookings.'}
                </p>
                {statusFilter === 'all' && (
                  <Link href="/browse" className="mt-5 inline-block">
                    <Button
                      size="sm"
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-5 text-xs font-semibold shadow-lg shadow-emerald-200"
                    >
                      Browse Turfs
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
                {statusFilter !== 'all' && (
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="mt-4 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Show all bookings →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
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