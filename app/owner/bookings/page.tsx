'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHoverDropdown } from '@/hooks/useHoverDropdown';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Building, LogOut, Calendar, ChevronDown, ChevronRight,
  BarChart3, Settings, CreditCard, User, Sparkles,
  CalendarCheck, Clock, IndianRupee, Activity, XCircle,
  CheckCircle2, AlertCircle, Filter, Search, X, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import BookingManager from '@/components/owner/BookingManager';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Types ───────────────────────────────────────────────────────────

interface Booking {
  _id: string;
  turfId: string | { _id: string; name?: string };
  customerId: string | { _id: string; name?: string };
  status: string;
  totalAmount: number;
  promoDiscountAmount?: number;
  dynamicDiscountAmount?: number;
  loyaltyDiscountAmount?: number;
  slot: {
    date: string;
    startTime: string;
    endTime: string;
    day: string;
  };
  createdAt: string;
}

interface Turf {
  _id: string;
  name: string;
}

interface BookingPageStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  totalRevenue: number;
  todayBookings: number;
  upcomingBookings: number;
}

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
        p-5 sm:p-6 transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${active
          ? 'border-emerald-300 shadow-lg shadow-emerald-50 ring-1 ring-emerald-200'
          : 'border-gray-100 hover:shadow-lg hover:shadow-emerald-50 hover:border-emerald-100'
        }
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`
            w-11 h-11 rounded-xl bg-gradient-to-br ${iconGradient}
            flex items-center justify-center text-white shadow-lg
            group-hover:scale-110 transition-transform duration-300
          `}
        >
          {icon}
        </div>
        {active && (
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
        {value}
      </p>
      <p className="text-sm font-medium text-gray-900 mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>
    </div>
  );
}

// ─── Main Bookings Component ─────────────────────────────────────────

function TurfOwnerBookings() {
  const { user, firebaseUser, logout } = useAuth();
  const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown();
  const router = useRouter();
  const searchParams = useSearchParams();
  const turfId = searchParams.get('turfId') || undefined;

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTurf, setSelectedTurf] = useState<string>(turfId || 'all');

  // ── Fetch data ──
  useEffect(() => {
    if (!user || !firebaseUser) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const idToken = await firebaseUser.getIdToken();

        const [turfsRes, bookingsRes] = await Promise.all([
          fetch('/api/turfs/manage', {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch(`/api/bookings/owner/${user.uid}`, {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
        ]);

        if (turfsRes.ok) {
          const d = await turfsRes.json();
          setTurfs(
            (d.turfs || []).map((t: any) => ({ _id: t._id, name: t.name }))
          );
        }

        if (bookingsRes.ok) {
          const d = await bookingsRes.json();
          setAllBookings(d.bookings || []);
        }
      } catch (err) {
        console.error('Error fetching bookings data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [firebaseUser, user]);

  // ── Compute stats ──
  const stats = useMemo((): BookingPageStats => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    let total = 0;
    let confirmed = 0;
    let pending = 0;
    let cancelled = 0;
    let totalRevenue = 0;
    let todayBookings = 0;
    let upcomingBookings = 0;

    for (const booking of allBookings) {
      // Filter by selected turf
      if (selectedTurf !== 'all') {
        const bookingTurfId =
          typeof booking.turfId === 'object' && booking.turfId !== null
            ? (booking.turfId as any)._id?.toString() || ''
            : booking.turfId?.toString() || '';
        if (bookingTurfId !== selectedTurf) continue;
      }

      total++;

      if (booking.status === 'confirmed') {
        confirmed++;
        totalRevenue += (booking.totalAmount || 0) - (booking.promoDiscountAmount || 0) - (booking.dynamicDiscountAmount || 0) - (booking.loyaltyDiscountAmount || 0);

        if (booking.slot?.date === todayStr) {
          todayBookings++;
        }
        if (booking.slot?.date && booking.slot.date >= todayStr) {
          upcomingBookings++;
        }
      }

      if (booking.status === 'pending' || booking.status === 'pending_payment') {
        pending++;
      }

      if (booking.status === 'cancelled') {
        cancelled++;
      }
    }

    return { total, confirmed, pending, cancelled, totalRevenue, todayBookings, upcomingBookings };
  }, [allBookings, selectedTurf]);

  // ── Get selected turf name ──
  const selectedTurfName = useMemo(() => {
    if (selectedTurf === 'all') return 'All Turfs';
    const turf = turfs.find((t) => t._id === selectedTurf);
    return turf?.name || 'Selected Turf';
  }, [selectedTurf, turfs]);

  if (!user) return null;

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
          </div>
          <p className="text-gray-500 font-medium">Loading bookings...</p>
          <p className="text-xs text-gray-400 mt-1">Fetching your booking data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">

      {/* ─────────── HEADER ─────────── */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <img
                src="/images/logo.png"
                alt="OutFyld Logo"
                className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
              />
              <h1 className="text-lg sm:text-xl font-bold text-emerald-600 tracking-tight">
                OutFyld
              </h1>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {[
                { label: 'Home', href: '/' },
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto p-1.5 hover:bg-gray-50 rounded-xl flex items-center gap-3 focus-visible:ring-0 focus-visible:outline-none focus:ring-0 border-none outline-none"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-base font-bold shadow-md">
                    {(user.name || 'O').charAt(0).toUpperCase()}
                  </div>
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-semibold text-gray-900 leading-none">{user.name}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{user.businessName || 'Arena Owner'}</p>
                  </div>
                  {user.subscriptionPlan && (
                    <Badge className="hidden md:flex bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[10px] font-semibold tracking-wide">
                      {user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-64 p-2 rounded-xl shadow-lg border-gray-100" 
                onMouseEnter={handleMouseEnter} 
                onMouseLeave={handleMouseLeave}
              >
                <DropdownMenuLabel className="font-semibold text-gray-900 px-3 py-2">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={() => router.push('/owner/profile')} className="cursor-pointer rounded-lg px-3 py-2.5 transition-colors focus:bg-emerald-50 focus:text-emerald-700">
                  <User className="mr-3 h-5 w-5" />
                  <span className="text-base">My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/owner/bank-details')} className="cursor-pointer rounded-lg px-3 py-2.5 transition-colors focus:bg-emerald-50 focus:text-emerald-700">
                  <CreditCard className="mr-3 h-5 w-5" />
                  <span className="text-base">Payment Details</span>
                </DropdownMenuItem>
                {(user.subscriptionPlan === 'premium' || user.subscriptionPlan === 'pro') && (
                  <DropdownMenuItem onClick={() => router.push('/owner/analytics')} className="cursor-pointer rounded-lg px-3 py-2.5 transition-colors focus:bg-emerald-50 focus:text-emerald-700">
                    <BarChart3 className="mr-3 h-5 w-5" />
                    <span className="text-base">Analytics</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={logout} className="cursor-pointer rounded-lg px-3 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-700 transition-colors">
                  <LogOut className="mr-3 h-5 w-5" />
                  <span className="text-base font-medium">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

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
              <Link
                href="/owner/dashboard"
                className="text-sm text-white/70 hover:text-white flex items-center gap-1.5 transition-colors duration-200 mb-4"
              >
                ← Dashboard
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Booking Management
                </h1>
                <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 text-[10px]">
                  <Calendar className="h-3 w-3 mr-1" />
                  {stats.total} Total
                </Badge>
              </div>
              <p className="text-emerald-200 text-sm">
                View and manage all bookings for your facilities.
              </p>
            </div>

            {/* Turf filter */}
            {turfs.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">Showing:</span>
                <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/30 bg-white/10 rounded-xl h-9 px-4 text-xs font-medium"
                    >
                      <Filter className="h-3.5 w-3.5 mr-1.5" />
                      {selectedTurfName}
                      <ChevronDown className="h-3 w-3 ml-1.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-gray-100 p-1" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <DropdownMenuItem
                      onClick={() => setSelectedTurf('all')}
                      className={`rounded-lg cursor-pointer ${selectedTurf === 'all' ? 'bg-emerald-50 text-emerald-700' : ''}`}
                    >
                      <Building className="mr-2 h-4 w-4 text-gray-400" />
                      All Turfs
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {turfs.map((turf) => (
                      <DropdownMenuItem
                        key={turf._id}
                        onClick={() => setSelectedTurf(turf._id)}
                        className={`rounded-lg cursor-pointer ${selectedTurf === turf._id ? 'bg-emerald-50 text-emerald-700' : ''}`}
                      >
                        <Building className="mr-2 h-4 w-4 text-gray-400" />
                        {turf.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
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
            label="Total"
            value={String(stats.total)}
            subtext="All-time bookings"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconGradient="from-green-500 to-teal-500"
            label="Confirmed"
            value={String(stats.confirmed)}
            subtext={`${stats.upcomingBookings} upcoming`}
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            iconGradient="from-amber-500 to-orange-500"
            label="Pending"
            value={String(stats.pending)}
            subtext="Awaiting action"
          />
          <StatCard
            icon={<XCircle className="h-5 w-5" />}
            iconGradient="from-red-500 to-rose-500"
            label="Cancelled"
            value={String(stats.cancelled)}
            subtext="All-time cancelled"
          />
          <StatCard
            icon={<IndianRupee className="h-5 w-5" />}
            iconGradient="from-teal-500 to-cyan-500"
            label="Revenue"
            value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
            subtext="From confirmed"
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            iconGradient="from-cyan-500 to-sky-500"
            label="Today"
            value={String(stats.todayBookings)}
            subtext="Bookings today"
          />
        </div>

        {/* ── Status Overview Bar ── */}
        {stats.total > 0 && (
          <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Booking Status Overview
              </h3>
              <span className="text-xs text-gray-400">
                {stats.total} total bookings
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
              {stats.confirmed > 0 && (
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${(stats.confirmed / stats.total) * 100}%` }}
                  title={`${stats.confirmed} confirmed`}
                />
              )}
              {stats.pending > 0 && (
                <div
                  className="h-full bg-amber-400 transition-all duration-700"
                  style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                  title={`${stats.pending} pending`}
                />
              )}
              {stats.cancelled > 0 && (
                <div
                  className="h-full bg-red-400 transition-all duration-700"
                  style={{ width: `${(stats.cancelled / stats.total) * 100}%` }}
                  title={`${stats.cancelled} cancelled`}
                />
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-5 mt-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-gray-500">
                  Confirmed ({stats.confirmed})
                </span>
                <span className="text-xs font-semibold text-gray-700">
                  {stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-xs text-gray-500">
                  Pending ({stats.pending})
                </span>
                <span className="text-xs font-semibold text-gray-700">
                  {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-xs text-gray-500">
                  Cancelled ({stats.cancelled})
                </span>
                <span className="text-xs font-semibold text-gray-700">
                  {stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Booking Manager ── */}
        <div className="mt-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">
                    All Bookings
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedTurfName} · {stats.total} bookings
                  </p>
                </div>
              </div>

              {/* Selected turf badge */}
              {selectedTurf !== 'all' && (
                <button
                  onClick={() => setSelectedTurf('all')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
                >
                  <Building className="h-3 w-3" />
                  {selectedTurfName}
                  <X className="h-3 w-3 ml-1" />
                </button>
              )}
            </div>

            {/* BookingManager */}
            <div className="p-0 sm:p-2">
              <BookingManager
                ownerId={user?.uid || ''}
                turfId={selectedTurf !== 'all' ? selectedTurf : turfId}
              />
            </div>
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <Building className="h-5 w-5" />,
              label: 'Dashboard',
              desc: 'Manage turfs and overview',
              href: '/owner/dashboard',
              gradient: 'from-emerald-500 to-green-600',
            },
            ...(user.subscriptionPlan === 'premium' || user.subscriptionPlan === 'pro'
              ? [{
                  icon: <BarChart3 className="h-5 w-5" />,
                  label: 'Analytics',
                  desc: 'Track performance and trends',
                  href: '/owner/analytics',
                  gradient: 'from-green-500 to-teal-500',
                }]
              : []),
            {
              icon: <Settings className="h-5 w-5" />,
              label: 'Settings',
              desc: 'Account and preferences',
              href: '/owner/settings',
              gradient: 'from-gray-600 to-gray-800',
            },
          ].map((item, i) => (
            <Link key={i} href={item.href}>
              <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {item.icon}
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-200" />
                </div>
                <h4 className="font-semibold text-gray-900 mt-4 text-sm">{item.label}</h4>
                <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <ProtectedRoute requireRole="owner">
      <TurfOwnerBookings />
    </ProtectedRoute>
  );
}