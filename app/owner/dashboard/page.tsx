'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHoverDropdown } from '@/hooks/useHoverDropdown';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import {
  Building, Calendar, MapPin, Settings,
  Plus, BarChart3, Clock, Trash2, Edit,
  ChevronDown, ChevronRight, Star,
  AlertTriangle, Loader2,
  LogOut, User as UserIcon, CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NightShell } from '@/components/night/NightShell';
import { NightLoader } from '@/components/night/NightLoader';
import { Mono, StatusDot, nightCard, nightCardHover, nightPrimaryBtn } from '@/components/night/ui';
import { CountUp } from '@/components/landing/night-match/CountUp';
import { Reveal } from '@/components/landing/night-match/Reveal';
import { PitchDivider } from '@/components/landing/night-match/PitchDivider';
import { ScoreboardSetPiece } from '@/components/landing/night-match/ScoreboardSetPiece';

// ─── Types ───────────────────────────────────────────────────────────
interface Turf {
  _id: string;
  name: string;
  description: string;
  images: Array<{ url: string; public_id: string }>;
  sportsOffered: string[];
  pricing: number;
  location: {
    address?: string;
    city?: string;
    state?: string;
  };
  isActive: boolean;
  rating?: number;
  reviewCount?: number;
}

interface Booking {
  _id: string;
  turfId: string | { _id: string };
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

interface BookingStats {
  [turfId: string]: {
    pending: number;
    confirmed: number;
    total: number;
  };
}

interface DashboardStats {
  totalTurfs: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  activeBookings: number;
  monthlyRevenue: number;
  averageRating: number;
  totalReviews: number;
}

// ─── Turf Card — editorial night card ────────────────────────────────
function TurfCard({
  turf,
  stats,
  deleting,
  onDelete,
  onEdit,
  onViewBookings,
}: {
  turf: Turf;
  stats?: { pending: number; confirmed: number; total: number };
  deleting: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onViewBookings: () => void;
}) {
  return (
    <div className={`${nightCard} ${nightCardHover} group overflow-hidden`}>
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-pitch-800">
        {turf.images && turf.images.length > 0 ? (
          <img
            src={turf.images[0].url}
            alt={turf.name}
            className="h-full w-full object-cover opacity-90 transition-transform duration-500 ease-night group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-pitch-800">
            <Building className="h-12 w-12 text-chalk-400/30" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-pitch-900/75 [mask-image:linear-gradient(to_top,black,transparent)]" />

        <span className="absolute right-3 top-3 flex items-center gap-2 rounded-[4px] border border-pitchline bg-pitch-900/80 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-100 backdrop-blur-sm">
          <StatusDot tone={turf.isActive ? 'lime' : 'chalk'} />
          {turf.isActive ? 'Active' : 'Inactive'}
        </span>

        <div className="absolute bottom-3 left-3">
          <span className="rounded-[4px] border border-pitchline bg-pitch-900/85 px-2.5 py-1.5 backdrop-blur-sm">
            <Mono className="text-sm text-chalk-100">₹{turf.pricing}</Mono>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-chalk-400">/hr</span>
          </span>
        </div>

        {turf.rating && turf.rating > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-[4px] border border-pitchline bg-pitch-900/85 px-2 py-1 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-flood-500 text-flood-500" />
            <Mono className="text-xs text-chalk-100">{turf.rating.toFixed(1)}</Mono>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="truncate font-display text-xl uppercase leading-tight tracking-tight text-chalk-100 transition-colors duration-200 group-hover:text-flood-500">
          {turf.name}
        </h3>

        <p className="mt-1 line-clamp-1 text-sm text-chalk-400">
          {turf.description}
        </p>

        <div className="mt-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-400">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-flood-500/70" />
          <span className="truncate normal-case tracking-normal">
            {[turf.location.city, turf.location.state].filter(Boolean).join(', ') || 'Location not set'}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {turf.sportsOffered.slice(0, 3).map((sport, i) => (
            <span
              key={i}
              className="rounded-[4px] border border-pitchline px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-chalk-400"
            >
              {sport}
            </span>
          ))}
          {turf.sportsOffered.length > 3 && (
            <span className="rounded-[4px] border border-pitchline px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-chalk-400/60">
              +{turf.sportsOffered.length - 3}
            </span>
          )}
        </div>

        {stats && (
          <div className="mt-4 flex items-center gap-4 border-t border-pitchline/60 pt-4">
            <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-chalk-400">
              <StatusDot tone="chalk" />
              <Mono className="text-chalk-100">{stats.pending}</Mono> pending
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-chalk-400">
              <StatusDot tone="lime" />
              <Mono className="text-chalk-100">{stats.confirmed}</Mono> confirmed
            </span>
            <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-chalk-400/70">
              <Mono>{stats.total}</Mono> total
            </span>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[4px] border border-chalk-400/30 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-100 transition-colors duration-200 ease-night hover:border-flood-500 hover:text-flood-500"
            onClick={onViewBookings}
          >
            <Calendar className="h-3.5 w-3.5" />
            Bookings
          </button>
          <button
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[4px] border border-chalk-400/30 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-100 transition-colors duration-200 ease-night hover:border-flood-500 hover:text-flood-500"
            onClick={onEdit}
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-chalk-400/30 text-chalk-400 transition-colors duration-200 ease-night hover:border-red-700 hover:text-red-500 disabled:pointer-events-none disabled:opacity-40"
            onClick={onDelete}
            disabled={deleting}
            aria-label="Delete arena"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard — MANAGER'S OFFICE ───────────────────────────────
function OwnerDashboard() {
  const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown();
  const { user, firebaseUser, logout } = useAuth();
  const router = useRouter();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Fetch turfs + ALL bookings in 2 parallel calls ──
  useEffect(() => {
    if (!user || !firebaseUser) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
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
          const turfsData = await turfsRes.json();
          setTurfs(turfsData.turfs || []);
        }

        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setAllBookings(bookingsData.bookings || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [firebaseUser, user]);

  // ── Compute all stats from bookings data ──
  const { bookingStats, dashboardStats } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const stats: BookingStats = {};
    for (const turf of turfs) {
      stats[turf._id] = { pending: 0, confirmed: 0, total: 0 };
    }

    let totalBookings = 0;
    let confirmedBookings = 0;
    let pendingBookings = 0;
    let activeBookings = 0;
    let monthlyRevenue = 0;

    for (const booking of allBookings) {
      const turfId =
        typeof booking.turfId === 'object' && booking.turfId !== null
          ? (booking.turfId as any)._id?.toString() || ''
          : booking.turfId?.toString() || '';

      if (!stats[turfId]) {
        stats[turfId] = { pending: 0, confirmed: 0, total: 0 };
      }

      stats[turfId].total++;
      totalBookings++;

      if (booking.status === 'confirmed') {
        stats[turfId].confirmed++;
        confirmedBookings++;

        if (booking.slot?.date && booking.slot.date >= todayStr) {
          activeBookings++;
        }

        const bookingDate = new Date(booking.createdAt || booking.slot?.date);
        if (
          bookingDate.getMonth() === currentMonth &&
          bookingDate.getFullYear() === currentYear
        ) {
          const finalAmount = (booking.totalAmount || 0)
            - (booking.promoDiscountAmount || 0)
            - (booking.dynamicDiscountAmount || 0)
            - (booking.loyaltyDiscountAmount || 0);
          monthlyRevenue += finalAmount;
        }
      }

      if (booking.status === 'pending' || booking.status === 'pending_payment') {
        stats[turfId].pending++;
        pendingBookings++;
      }
    }

    const ratedTurfs = turfs.filter((t) => t.rating && t.rating > 0);
    const averageRating =
      ratedTurfs.length > 0
        ? ratedTurfs.reduce((sum, t) => sum + (t.rating || 0), 0) / ratedTurfs.length
        : 0;
    const totalReviews = turfs.reduce((sum, t) => sum + (t.reviewCount || 0), 0);

    return {
      bookingStats: stats,
      dashboardStats: {
        totalTurfs: turfs.length,
        totalBookings,
        confirmedBookings,
        pendingBookings,
        activeBookings,
        monthlyRevenue,
        averageRating,
        totalReviews,
      } as DashboardStats,
    };
  }, [turfs, allBookings]);

  // ── Handlers ──
  const handleDeleteTurf = async (turfId: string) => {
    if (!firebaseUser) return;
    if (!confirm('Are you sure you want to delete this arena? This action cannot be undone.')) return;

    setDeleting(turfId);
    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/turfs/manage', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ turfId }),
      });

      if (response.ok) {
        setTurfs(turfs.filter((t) => t._id !== turfId));
        toast.success('Turf deleted successfully');
      } else {
        toast.error('Failed to delete arena');
      }
    } catch (error) {
      console.error('Error deleting arena:', error);
      toast.error('Error deleting arena');
    } finally {
      setDeleting(null);
    }
  };

  const handleAddTurf = async () => {
    if (!user?.uid) return;
    try {
      const response = await fetch(`/api/owner/subscription?uid=${user.uid}`);
      const data = await response.json();

      if (data.success) {
        if (!data.subscription.subscriptionPlan) {
          router.push('/owner/subscription');
          return;
        }
        if (data.subscription.verificationStatus === 'pending') {
          toast.info('Your subscription is pending admin approval.');
          return;
        }
        if (data.subscription.verificationStatus === 'rejected') {
          toast.error(`Subscription rejected: ${data.subscription.rejectionReason || 'Contact support.'}`);
          return;
        }
        if (data.subscription.verificationStatus === 'approved') {
          const plan = data.subscription.subscriptionPlan;
          if ((plan === 'basic' || plan === 'starter') && turfs.length >= 1) {
            toast.error('Basic plan: max 1 arena. Upgrade to add more.');
            return;
          }
          if ((plan === 'premium' || plan === 'pro') && turfs.length >= 3) {
            toast.error('Premium plan: max 3 arenas. Contact support for more.');
            return;
          }
          router.push('/dashboard/turf-owner');
        }
      }
    } catch {
      router.push('/owner/subscription');
    }
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  if (!user) return null;

  if (loading) {
    return (
      <NightShell ambient={0.45}>
        <div className="flex min-h-screen items-center justify-center">
          <NightLoader label="Opening the office…" />
        </div>
      </NightShell>
    );
  }

  const flatStats: { label: string; value: number; prefix?: string; decimals?: number }[] = [
    { label: 'Arenas', value: dashboardStats.totalTurfs },
    { label: 'Bookings', value: dashboardStats.totalBookings },
    { label: 'Confirmed', value: dashboardStats.confirmedBookings },
    { label: 'Pending', value: dashboardStats.pendingBookings },
    { label: 'Revenue (mo)', value: dashboardStats.monthlyRevenue, prefix: '₹' },
    { label: 'Avg rating', value: dashboardStats.averageRating, decimals: 1 },
  ];

  return (
    <NightShell ambient={0.45}>

      {/* ─────────── HEADER — restyled in place ─────────── */}
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
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-flood-500">
                Dashboard
              </span>
            </nav>

            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex h-auto items-center gap-3 rounded-[4px] border-none p-1.5 outline-none hover:bg-white/[0.04] focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-flood-500 font-display text-base uppercase text-pitch-900">
                    {(user.name || 'O').charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden text-right lg:block">
                    <p className="text-sm font-semibold leading-none text-chalk-100">
                      {user.name}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-400">
                      {user.businessName || 'Arena Owner'}
                    </p>
                  </div>
                  {user.subscriptionPlan && (
                    <span className="hidden rounded-[4px] border border-flood-500/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-flood-500 md:inline-flex">
                      {user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)}
                    </span>
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
                <DropdownMenuLabel className="nm-overline px-3 py-2 text-chalk-400">
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={() => router.push('/owner/profile')} className="cursor-pointer rounded-[4px] px-3 py-2.5 transition-colors">
                  <UserIcon className="mr-3 h-5 w-5" />
                  <span className="text-base">My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/owner/bank-details')} className="cursor-pointer rounded-[4px] px-3 py-2.5 transition-colors">
                  <CreditCard className="mr-3 h-5 w-5" />
                  <span className="text-base">Payment Details</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/owner/analytics')} className="cursor-pointer rounded-[4px] px-3 py-2.5 transition-colors">
                  <BarChart3 className="mr-3 h-5 w-5" />
                  <span className="text-base">Analytics</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={logout} className="cursor-pointer rounded-[4px] px-3 py-2.5 text-red-500 transition-colors focus:text-red-400">
                  <LogOut className="mr-3 h-5 w-5" />
                  <span className="text-base font-medium">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ─────────── TITLE — MANAGER'S OFFICE ─────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <Reveal>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="nm-overline mb-3 text-flood-500">Manager&apos;s office</p>
              <h1 className="nm-display-l text-chalk-100">
                {greeting},{' '}
                <span className="relative inline-block">
                  {user.name?.split(' ')[0]}
                  <span
                    className="absolute -bottom-2 left-0 h-[2px] w-full origin-left -rotate-[1.5deg] bg-flood-500 shadow-flood"
                    aria-hidden
                  />
                </span>
              </h1>
              <p className="mt-4 max-w-md text-sm text-chalk-400">
                Run your arenas and fixtures from the touchline.
              </p>
            </div>
            <button onClick={handleAddTurf} className={`${nightPrimaryBtn} shrink-0`}>
              <Plus className="h-4 w-4" />
              Add New Arena
            </button>
          </div>
        </Reveal>
      </section>

      {/* ─────────── Verification alerts ─────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {user.verificationStatus === 'pending' && (
          <div className={`${nightCard} mb-6 flex items-start gap-4 border-l-2 border-l-chalk-400/60 p-5`}>
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-chalk-400" />
            <div>
              <p className="nm-overline flex items-center gap-2 text-chalk-100">
                <StatusDot tone="chalk" />
                Verification pending
              </p>
              <p className="mt-2 text-xs leading-relaxed text-chalk-400">
                Your account is awaiting admin verification. You can list turfs once approved.
              </p>
            </div>
          </div>
        )}

        {user.verificationStatus === 'rejected' && (
          <div className={`${nightCard} mb-6 flex items-start gap-4 border-l-2 border-l-red-700 p-5`}>
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="nm-overline flex items-center gap-2 text-chalk-100">
                <StatusDot tone="red" />
                Application rejected
              </p>
              <p className="mt-2 text-xs leading-relaxed text-chalk-400">
                Reason: {user.rejectionReason || 'No reason provided'}. Contact support to reapply.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─────────── CLUB TOTALS — 3D stadium scoreboard ─────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScoreboardSetPiece
          cells={[
            { label: 'TOTAL ARENAS', value: dashboardStats.totalTurfs },
            { label: 'BOOKINGS', value: dashboardStats.totalBookings },
            { label: 'REVENUE (RS)', value: dashboardStats.monthlyRevenue },
            { label: 'AVG RATING', value: dashboardStats.averageRating, decimals: 1 },
          ]}
          srText={`${dashboardStats.totalTurfs} arenas listed. ${dashboardStats.totalBookings} total bookings. ₹${dashboardStats.monthlyRevenue.toLocaleString('en-IN')} revenue this month. ${dashboardStats.averageRating.toFixed(1)} average rating.`}
        >
          <div className="grid grid-cols-3 gap-y-8 rounded-[4px] border border-pitchline bg-pitch-700/80 px-6 py-7 lg:grid-cols-6 lg:divide-x lg:divide-pitchline/60">
            {flatStats.map((s, i) => (
              <div key={s.label} className={i > 0 ? 'lg:pl-7' : ''}>
                <div className="font-mono text-2xl tabular-nums tracking-tight text-chalk-100 sm:text-3xl">
                  <CountUp value={s.value} prefix={s.prefix || ''} decimals={s.decimals || 0} />
                </div>
                <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </ScoreboardSetPiece>
      </section>

      {/* ─────────── MY ARENAS ─────────── */}
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="nm-overline text-chalk-400">The grounds</p>
              <h2 className="mt-2 font-display text-3xl uppercase tracking-tight text-chalk-100">
                My Arenas
              </h2>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                <Mono>{turfs.length}</Mono> {turfs.length === 1 ? 'facility' : 'facilities'} listed
              </p>
            </div>
            {turfs.length > 0 && (
              <button
                onClick={handleAddTurf}
                className="nm-overline inline-flex items-center gap-2 rounded-[4px] border border-chalk-400/30 px-5 py-2.5 text-chalk-100 transition-colors duration-200 ease-night hover:border-flood-500 hover:text-flood-500"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Arena
              </button>
            )}
          </div>
        </Reveal>

        {turfs.length === 0 ? (
          <Reveal>
            <div className="rounded-[4px] border-2 border-dashed border-pitchline bg-pitch-700/40 p-10 text-center sm:p-14">
              <Building className="mx-auto h-10 w-10 text-chalk-400/40" />
              <h3 className="mt-6 font-display text-2xl uppercase tracking-tight text-chalk-100">
                No arenas added yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-chalk-400">
                Get started by adding your first turf facility. Set pricing,
                availability, and start receiving bookings from players.
              </p>
              <button onClick={handleAddTurf} className={`${nightPrimaryBtn} mt-6`}>
                <Plus className="h-4 w-4" />
                Add Your First Arena
              </button>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {turfs.map((turf, i) => (
              <Reveal key={turf._id} delay={Math.min(i * 0.06, 0.24)}>
                <TurfCard
                  turf={turf}
                  stats={bookingStats[turf._id]}
                  deleting={deleting === turf._id}
                  onDelete={() => handleDeleteTurf(turf._id)}
                  onEdit={() => router.push(`/dashboard/turf-owner?turfId=${turf._id}`)}
                  onViewBookings={() => router.push(`/owner/bookings?turfId=${turf._id}`)}
                />
              </Reveal>
            ))}
          </div>
        )}

        {/* Getting Started Guide */}
        {turfs.length === 0 && (
          <>
            <PitchDivider className="my-4" />
            <Reveal>
              <div className={`${nightCard} overflow-hidden`}>
                <div className="border-b border-pitchline/60 px-6 py-4">
                  <p className="nm-overline text-flood-500">The pre-season plan</p>
                </div>
                <div>
                  {[
                    { step: '01', title: 'Add your turf', desc: 'Upload photos, set location and sports' },
                    { step: '02', title: 'Set pricing', desc: 'Configure hourly rates and discounts' },
                    { step: '03', title: 'Set availability', desc: 'Define your operating hours and slots' },
                    { step: '04', title: 'Start earning', desc: 'Receive and manage bookings' },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-baseline gap-5 border-b border-pitchline/60 px-6 py-4 last:border-0"
                    >
                      <Mono className="text-2xl text-flood-500">{item.step}</Mono>
                      <div>
                        <h4 className="font-display text-lg uppercase tracking-tight text-chalk-100">
                          {item.title}
                        </h4>
                        <p className="mt-0.5 text-xs text-chalk-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </>
        )}

        {/* Quick Links — editorial rows, no icon-square grid */}
        {turfs.length > 0 && (
          <>
            <PitchDivider className="my-6" />
            <Reveal>
              <div className={`${nightCard} overflow-hidden`}>
                <div className="border-b border-pitchline/60 px-6 py-4">
                  <p className="nm-overline text-chalk-400">Touchline shortcuts</p>
                </div>
                <div>
                  {[
                    {
                      icon: <BarChart3 className="h-4 w-4" />,
                      label: 'View Analytics',
                      desc: 'Track performance and trends',
                      href: '/owner/analytics',
                    },
                    {
                      icon: <Calendar className="h-4 w-4" />,
                      label: 'All Bookings',
                      desc: 'Manage upcoming bookings',
                      href: '/owner/bookings',
                    },
                    {
                      icon: <Settings className="h-4 w-4" />,
                      label: 'Settings',
                      desc: 'Account and preferences',
                      href: '/owner/settings',
                    },
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
            </Reveal>
          </>
        )}
      </div>
    </NightShell>
  );
}

export default function OwnerDashboardPage() {
  return (
    <ProtectedRoute requireRole="owner">
      <OwnerDashboard />
    </ProtectedRoute>
  );
}
