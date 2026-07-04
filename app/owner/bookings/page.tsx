'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHoverDropdown } from '@/hooks/useHoverDropdown';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { NightShell } from '@/components/night/NightShell';
import { NightLoader } from '@/components/night/NightLoader';
import { CountUp } from '@/components/landing/night-match/CountUp';
import { Reveal } from '@/components/landing/night-match/Reveal';
import { PitchDivider } from '@/components/landing/night-match/PitchDivider';
import {
  Mono, Overline, StatusDot, nightCard, nightCardHover,
} from '@/components/night/ui';
import {
  Building, LogOut, ChevronDown, ChevronRight,
  BarChart3, Settings, CreditCard, User,
  Filter, X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import — BookingManager is heavy (calendar, charts, complex UI)
const BookingManager = dynamic(
  () => import('@/components/owner/BookingManager'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center rounded-[4px] border border-pitchline bg-pitch-800/60">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-chalk-400">
          Loading bookings…
        </p>
      </div>
    ),
  }
);
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

// ─── Scoreboard stat cell ────────────────────────────────────────────

function StatCell({
  label,
  value,
  prefix = '',
  subtext,
  divide = false,
}: {
  label: string;
  value: number;
  prefix?: string;
  subtext: string;
  divide?: boolean;
}) {
  return (
    <div className={divide ? 'lg:pl-7' : ''}>
      <div className="font-mono text-2xl tabular-nums tracking-tight text-chalk-100 sm:text-3xl">
        <CountUp value={value} prefix={prefix} />
      </div>
      <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-400">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-[9px] text-chalk-400/60">{subtext}</p>
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
      <NightShell ambient={0.45}>
        <div className="flex min-h-screen items-center justify-center">
          <NightLoader label="Opening the fixture book…" />
        </div>
      </NightShell>
    );
  }

  return (
    <NightShell ambient={0.45}>

      {/* ─────────── HEADER ─────────── */}
      <header className="sticky top-0 z-50 border-b border-pitchline bg-pitch-900/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
              <img
                src="/images/logo.png"
                alt="OutFyld Logo"
                className="h-9 w-9 object-contain sm:h-10 sm:w-10"
              />
              <h1 className="font-display text-lg uppercase tracking-tight text-chalk-100 sm:text-xl">
                OutFyld
              </h1>
            </Link>

            <nav className="hidden items-center gap-8 lg:flex">
              {[
                { label: 'Home', href: '/' },
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto p-1.5 hover:bg-white/[0.04] rounded-[4px] flex items-center gap-3 focus-visible:ring-0 focus-visible:outline-none focus:ring-0 border-none outline-none"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-flood-500 font-display text-base text-pitch-900">
                    {(user.name || 'O').charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden text-right lg:block">
                    <p className="text-sm leading-none text-chalk-100">{user.name}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-400">{user.businessName || 'Arena Owner'}</p>
                  </div>
                  {user.subscriptionPlan && (
                    <Overline tone="lime" className="hidden md:inline-flex">
                      {user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)}
                    </Overline>
                  )}
                  <ChevronDown className="h-4 w-4 text-chalk-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 rounded-[4px] p-2"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <DropdownMenuLabel className="nm-overline px-3 py-2 text-chalk-400">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={() => router.push('/owner/profile')} className="cursor-pointer rounded-[4px] px-3 py-2.5 transition-colors focus:bg-white/[0.06] focus:text-flood-500">
                  <User className="mr-3 h-5 w-5" />
                  <span className="text-base">My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/owner/bank-details')} className="cursor-pointer rounded-[4px] px-3 py-2.5 transition-colors focus:bg-white/[0.06] focus:text-flood-500">
                  <CreditCard className="mr-3 h-5 w-5" />
                  <span className="text-base">Payment Details</span>
                </DropdownMenuItem>
                {(user.subscriptionPlan === 'premium' || user.subscriptionPlan === 'pro') && (
                  <DropdownMenuItem onClick={() => router.push('/owner/analytics')} className="cursor-pointer rounded-[4px] px-3 py-2.5 transition-colors focus:bg-white/[0.06] focus:text-flood-500">
                    <BarChart3 className="mr-3 h-5 w-5" />
                    <span className="text-base">Analytics</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={logout} className="cursor-pointer rounded-[4px] px-3 py-2.5 text-red-400 transition-colors focus:bg-red-500/10 focus:text-red-300">
                  <LogOut className="mr-3 h-5 w-5" />
                  <span className="text-base font-medium">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ─────────── PAGE TITLE ─────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <Reveal>
          <Link
            href="/owner/dashboard"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
          >
            ← Dashboard
          </Link>
          <div className="mt-5 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="nm-overline mb-3 text-flood-500">The manager&apos;s office</p>
              <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-chalk-100 sm:text-5xl lg:text-6xl">
                Fixture book
              </h1>
              <p className="mt-4 text-sm text-chalk-400">
                View and manage all bookings for your facilities —{' '}
                <Mono className="text-chalk-100">{stats.total}</Mono> fixtures logged.
              </p>
            </div>

            {/* Turf filter */}
            {turfs.length > 1 && (
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Showing</span>
                <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 rounded-[4px] border-chalk-400/30 bg-transparent px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-100 transition-colors duration-200 ease-night hover:border-flood-500 hover:bg-transparent hover:text-flood-500"
                    >
                      <Filter className="mr-1.5 h-3.5 w-3.5" />
                      {selectedTurfName}
                      <ChevronDown className="ml-1.5 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-[4px] p-1" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <DropdownMenuItem
                      onClick={() => setSelectedTurf('all')}
                      className={`cursor-pointer rounded-[4px] ${selectedTurf === 'all' ? 'bg-white/[0.06] text-flood-500' : ''}`}
                    >
                      <Building className="mr-2 h-4 w-4 text-chalk-400" />
                      All Turfs
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {turfs.map((turf) => (
                      <DropdownMenuItem
                        key={turf._id}
                        onClick={() => setSelectedTurf(turf._id)}
                        className={`cursor-pointer rounded-[4px] ${selectedTurf === turf._id ? 'bg-white/[0.06] text-flood-500' : ''}`}
                      >
                        <Building className="mr-2 h-4 w-4 text-chalk-400" />
                        {turf.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </Reveal>
      </section>

      <PitchDivider flag="right" />

      {/* ─────────── MAIN CONTENT ─────────── */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">

        {/* ── Season tally — scoreboard strip ── */}
        <Reveal>
          <div className="grid grid-cols-2 gap-y-8 rounded-[4px] border border-pitchline bg-pitch-700/80 px-6 py-7 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-pitchline/60">
            <StatCell label="Total" value={stats.total} subtext="All-time bookings" />
            <StatCell label="Confirmed" value={stats.confirmed} subtext={`${stats.upcomingBookings} upcoming`} divide />
            <StatCell label="Pending" value={stats.pending} subtext="Awaiting action" divide />
            <StatCell label="Cancelled" value={stats.cancelled} subtext="All-time cancelled" divide />
            <StatCell label="Revenue" value={stats.totalRevenue} prefix="₹" subtext="From confirmed" divide />
            <StatCell label="Today" value={stats.todayBookings} subtext="Bookings today" divide />
          </div>
        </Reveal>

        {/* ── Status Overview Bar ── */}
        {stats.total > 0 && (
          <Reveal delay={0.08}>
            <div className={`${nightCard} mt-5 p-5`}>
              <div className="mb-3 flex items-center justify-between">
                <Overline>Booking status overview</Overline>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
                  <Mono className="text-chalk-100">{stats.total}</Mono> total bookings
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex h-2 overflow-hidden rounded-[2px] bg-pitch-800">
                {stats.confirmed > 0 && (
                  <div
                    className="h-full bg-flood-500 transition-all duration-700 ease-night"
                    style={{ width: `${(stats.confirmed / stats.total) * 100}%` }}
                    title={`${stats.confirmed} confirmed`}
                  />
                )}
                {stats.pending > 0 && (
                  <div
                    className="h-full bg-chalk-400/70 transition-all duration-700 ease-night"
                    style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                    title={`${stats.pending} pending`}
                  />
                )}
                {stats.cancelled > 0 && (
                  <div
                    className="h-full bg-red-700 transition-all duration-700 ease-night"
                    style={{ width: `${(stats.cancelled / stats.total) * 100}%` }}
                    title={`${stats.cancelled} cancelled`}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
                  <StatusDot tone="lime" />
                  Confirmed (<Mono>{stats.confirmed}</Mono>)
                  <Mono className="text-chalk-100">
                    {stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}%
                  </Mono>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
                  <StatusDot tone="chalk" />
                  Pending (<Mono>{stats.pending}</Mono>)
                  <Mono className="text-chalk-100">
                    {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
                  </Mono>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
                  <StatusDot tone="red" />
                  Cancelled (<Mono>{stats.cancelled}</Mono>)
                  <Mono className="text-chalk-100">
                    {stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0}%
                  </Mono>
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {/* ── Booking Manager ── */}
        <div className="mt-5">
          <div className={`${nightCard} overflow-hidden`}>
            {/* Section header */}
            <div className="flex items-center justify-between border-b border-pitchline/60 px-6 py-4">
              <div>
                <Overline>All bookings</Overline>
                <p className="mt-1 font-mono text-[10px] text-chalk-400">
                  {selectedTurfName} · <Mono>{stats.total}</Mono> bookings
                </p>
              </div>

              {/* Selected turf tag */}
              {selectedTurf !== 'all' && (
                <button
                  onClick={() => setSelectedTurf('all')}
                  className="flex items-center gap-1.5 rounded-[4px] border border-flood-500/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-flood-500 transition-colors duration-200 ease-night hover:border-flood-500"
                >
                  <Building className="h-3 w-3" />
                  {selectedTurfName}
                  <X className="ml-1 h-3 w-3" />
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
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: <Building className="h-5 w-5" />,
              label: 'Dashboard',
              desc: 'Manage turfs and overview',
              href: '/owner/dashboard',
            },
            ...(user.subscriptionPlan === 'premium' || user.subscriptionPlan === 'pro'
              ? [{
                  icon: <BarChart3 className="h-5 w-5" />,
                  label: 'Analytics',
                  desc: 'Track performance and trends',
                  href: '/owner/analytics',
                }]
              : []),
            {
              icon: <Settings className="h-5 w-5" />,
              label: 'Settings',
              desc: 'Account and preferences',
              href: '/owner/settings',
            },
          ].map((item, i) => (
            <Link key={i} href={item.href}>
              <div className={`${nightCard} ${nightCardHover} group h-full cursor-pointer p-5`}>
                <div className="flex items-start justify-between">
                  <span className="text-flood-500">{item.icon}</span>
                  <ChevronRight className="h-4 w-4 text-chalk-400 transition-all duration-200 ease-night group-hover:translate-x-1 group-hover:text-flood-500" />
                </div>
                <h4 className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-100">{item.label}</h4>
                <p className="mt-1 font-mono text-[10px] text-chalk-400">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </NightShell>
  );
}

export default function BookingsPage() {
  return (
    <ProtectedRoute requireRole="owner">
      <TurfOwnerBookings />
    </ProtectedRoute>
  );
}
