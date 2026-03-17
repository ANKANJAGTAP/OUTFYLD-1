'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MapPin, Calendar, Clock, Star, User, LogOut, Search,
  History, Heart, Trophy, ChevronRight, Shield,
  CalendarCheck, Loader2, Sparkles, Activity,
  ArrowRight, ExternalLink, CheckCircle2, XCircle,
  IndianRupee, Zap, MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

interface BookingItem {
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

// ─── Stat Card ───────────────────────────────────────────────────────

function StatCard({
  icon,
  iconGradient,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  iconGradient: string;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg hover:shadow-emerald-50 hover:border-emerald-100 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
        {value}
      </p>
      <p className="text-sm font-medium text-gray-900 mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>
    </div>
  );
}

// ─── Booking Card ────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: BookingItem }) {
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
  const isUpcoming = booking.status === 'confirmed' && new Date(booking.date) >= new Date();
  const isCompleted = booking.status === 'completed' || (booking.status === 'confirmed' && new Date(booking.date) < new Date());

  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200">
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

          {/* Status badge */}
          <span
            className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.bg} ${status.color}`}
          >
            {status.icon}
            {status.label}
          </span>
        </div>

        {/* Time + Amount */}
        <div className="flex items-center gap-4 mt-2">
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
              {booking.amount}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {isCompleted && (
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
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Quick Action Card ───────────────────────────────────────────────

function QuickAction({
  icon,
  label,
  description,
  href,
  gradient,
  primary = false,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  gradient: string;
  primary?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={`
          group relative rounded-2xl border p-5
          transition-all duration-300 cursor-pointer h-full
          ${primary
            ? 'bg-gradient-to-br from-emerald-600 to-green-600 border-emerald-500 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300'
            : 'bg-white border-gray-100 shadow-sm hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50'
          }
        `}
      >
        <div className="flex items-start justify-between">
          <div
            className={`
              w-11 h-11 rounded-xl flex items-center justify-center shadow-lg
              transition-transform duration-300 group-hover:scale-110
              ${primary
                ? 'bg-white/20 text-white'
                : `bg-gradient-to-br ${gradient} text-white`
              }
            `}
          >
            {icon}
          </div>
          <ChevronRight
            className={`h-4 w-4 group-hover:translate-x-1 transition-all duration-200 ${
              primary ? 'text-white/50 group-hover:text-white/80' : 'text-gray-300 group-hover:text-emerald-400'
            }`}
          />
        </div>
        <h4 className={`font-semibold mt-4 text-sm ${primary ? 'text-white' : 'text-gray-900'}`}>
          {label}
        </h4>
        <p className={`text-xs mt-1 leading-relaxed ${primary ? 'text-emerald-100' : 'text-gray-400'}`}>
          {description}
        </p>
      </div>
    </Link>
  );
}

// ─── Main Player Dashboard ───────────────────────────────────────────

function PlayerDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  if (!user) return null;

  // ── Fetch data ──
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [bookingsRes, loyaltyRes] = await Promise.all([
          fetch(`/api/bookings/customer/${user.uid}?limit=5`),
          fetch(`/api/loyalty/customer/${user.uid}`),
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
  }, [user.uid]);

  // ── Compute stats ──
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
        totalSpent += b.totalAmount || 0;
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

  // ── Transform bookings for display ──
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
          'Unknown Turf',
        location:
          b.turfId?.location?.city ||
          b.turfId?.location?.address ||
          'Location unavailable',
        date: b.slot?.date || '',
        day: b.slot?.day || '',
        time: `${b.slot?.startTime || ''} - ${b.slot?.endTime || ''}`,
        status: displayStatus,
        amount: b.totalAmount || 0,
        sport: b.turfId?.sportsOffered?.[0] || 'Sports',
      };
    });
  }, [bookings]);

  // ── Greeting ──
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

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
            <p className="text-gray-500 font-medium">Loading your dashboard...</p>
            <p className="text-xs text-gray-400 mt-1">Fetching your bookings and stats</p>
          </div>
        </div>
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
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 sm:pb-24">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {greeting}, {user.name?.split(' ')[0]}! 🏏
                </h1>
                {loyaltyPoints > 0 && (
                  <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 text-[10px]">
                    <Trophy className="h-3 w-3 mr-1" />
                    {loyaltyPoints} pts
                  </Badge>
                )}
              </div>
              <p className="text-emerald-200 text-sm">
                Ready to book your next game? Find and reserve the best turfs near you.
              </p>
            </div>

            <Link href="/browse">
              <Button className="bg-white text-emerald-700 hover:bg-gray-100 rounded-xl h-11 px-6 font-semibold shadow-xl transition-all duration-200">
                <Search className="h-4 w-4 mr-2" />
                Find Turfs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────── MAIN CONTENT ─────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-12">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            icon={<CalendarCheck className="h-5 w-5" />}
            iconGradient="from-emerald-500 to-green-600"
            label="Total Bookings"
            value={String(stats.totalBookings)}
            subtext="All-time bookings"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconGradient="from-green-500 to-teal-500"
            label="Completed"
            value={String(stats.completedGames)}
            subtext="Games played"
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            iconGradient="from-teal-500 to-cyan-500"
            label="Upcoming"
            value={String(stats.upcomingGames)}
            subtext="Scheduled games"
          />
          <StatCard
            icon={<Trophy className="h-5 w-5" />}
            iconGradient="from-amber-500 to-orange-500"
            label="Loyalty Points"
            value={String(stats.loyaltyPoints)}
            subtext="Earned rewards"
          />
          <StatCard
            icon={<IndianRupee className="h-5 w-5" />}
            iconGradient="from-cyan-500 to-sky-500"
            label="Total Spent"
            value={`₹${stats.totalSpent.toLocaleString('en-IN')}`}
            subtext="On bookings"
          />
          <StatCard
            icon={<XCircle className="h-5 w-5" />}
            iconGradient="from-gray-400 to-gray-500"
            label="Cancelled"
            value={String(stats.cancelledBookings)}
            subtext="Cancelled bookings"
          />
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">

          {/* Recent Bookings */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <History className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">Recent Bookings</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Your recent and upcoming reservations</p>
                </div>
              </div>
              <Link href="/dashboard/player/bookings">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-medium"
                >
                  View All
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="p-2">
              {recentBookings.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-7 w-7 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">No bookings yet</h3>
                  <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto">
                    Start by browsing turfs near you and booking your first game!
                  </p>
                  <Link href="/browse" className="mt-5 inline-block">
                    <Button
                      size="sm"
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-5 text-xs font-semibold shadow-lg shadow-emerald-200"
                    >
                      Browse Turfs
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {recentBookings.map((booking, i) => (
                    <div key={booking.id}>
                      <BookingCard booking={booking} />
                      {i < recentBookings.length - 1 && (
                        <Separator className="mx-4" />
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            {recentBookings.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-50">
                <Link href="/dashboard/player/bookings">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 h-10 text-sm font-medium transition-all"
                  >
                    <History className="h-4 w-4 mr-2" />
                    View All Bookings ({stats.totalBookings})
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px]">Quick Actions</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Find and book your next game</p>
                  </div>
                </div>
              </div>

              <div className="p-3 space-y-2">
                <Link href="/browse" className="block">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                      <Search className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-emerald-800">Browse All Turfs</p>
                      <p className="text-[11px] text-emerald-600">Find the perfect turf near you</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {[
                  {
                    icon: <History className="h-4 w-4" />,
                    label: 'Booking History',
                    desc: 'View past bookings',
                    href: '/dashboard/player/bookings',
                  },
                  {
                    icon: <Trophy className="h-4 w-4" />,
                    label: 'Rewards & Points',
                    desc: `${loyaltyPoints} points available`,
                    href: '/dashboard/player/rewards',
                  },
                  {
                    icon: <User className="h-4 w-4" />,
                    label: 'My Profile',
                    desc: 'Account settings',
                    href: '/dashboard/player/profile',
                  },
                ].map((item, i) => (
                  <Link key={i} href={item.href} className="block">
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-[11px] text-gray-400">{item.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Loyalty Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '16px 16px',
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-5 w-5 text-amber-300" />
                  <span className="text-sm font-semibold">Loyalty Rewards</span>
                </div>
                <p className="text-3xl font-bold">{loyaltyPoints}</p>
                <p className="text-emerald-200 text-xs mt-1">
                  Points available
                </p>
                <Separator className="my-4 bg-white/20" />
                <p className="text-emerald-100 text-xs leading-relaxed">
                  Earn points with every booking. Redeem them for discounts on future games!
                </p>
              </div>
            </div>

            {/* Favorites placeholder */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px]">Favorite Turfs</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Your saved spots</p>
                  </div>
                </div>
              </div>
              <div className="p-6 text-center">
                <Heart className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayerDashboardPage() {
  return (
    <ProtectedRoute requireRole="customer">
      <PlayerDashboard />
    </ProtectedRoute>
  );
}