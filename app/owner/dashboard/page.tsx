'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHoverDropdown } from '@/hooks/useHoverDropdown';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Building, Calendar, Users, TrendingUp, MapPin, Settings,
  Plus, BarChart3, Clock, Trash2, Eye, IndianRupee, Edit,
  ChevronDown, ChevronRight, Sparkles, Star, CalendarCheck,
  ArrowUpRight, Activity, Zap, AlertTriangle, ShieldCheck,
  Loader2, X, ExternalLink, LayoutDashboard, RefreshCw,
  LogOut, User as UserIcon, CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

// ─── Stat Card Component ─────────────────────────────────────────────
function StatCard({
  icon,
  iconGradient,
  label,
  value,
  subtext,
  trend,
  trendValue,
}: {
  icon: React.ReactNode;
  iconGradient: string;
  label: string;
  value: string;
  subtext: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  return (
    <div
      className="
        group bg-white rounded-2xl border border-gray-100 shadow-sm
        p-5 sm:p-6
        hover:shadow-lg hover:shadow-emerald-50 hover:border-emerald-100
        transition-all duration-300
      "
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
        {trend && trendValue && (
          <div
            className={`
              flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
              ${trend === 'up'
                ? 'bg-emerald-50 text-emerald-700'
                : trend === 'down'
                ? 'bg-red-50 text-red-600'
                : 'bg-gray-50 text-gray-500'
              }
            `}
          >
            {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
            {trendValue}
          </div>
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

// ─── Turf Card Component ─────────────────────────────────────────────
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
    <div
      className="
        group bg-white rounded-2xl border border-gray-100 shadow-sm
        overflow-hidden
        hover:shadow-xl hover:shadow-emerald-50 hover:border-emerald-100
        transition-all duration-300
      "
    >
      {/* Image */}
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        {turf.images && turf.images.length > 0 ? (
          <img
            src={turf.images[0].url}
            alt={turf.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <Building className="h-12 w-12 text-gray-300" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <Badge
          className={`
            absolute top-3 right-3 text-xs font-semibold px-2.5
            ${turf.isActive
              ? 'bg-emerald-500 text-white border-0 shadow-lg'
              : 'bg-gray-500 text-white border-0'
            }
          `}
        >
          {turf.isActive ? '● Active' : 'Inactive'}
        </Badge>

        <div className="absolute bottom-3 left-3">
          <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
            ₹{turf.pricing}<span className="text-xs font-normal text-gray-500">/hr</span>
          </span>
        </div>

        {turf.rating && turf.rating > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-md">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-gray-900">
              {turf.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-emerald-700 transition-colors">
          {turf.name}
        </h3>

        <p className="text-sm text-gray-500 line-clamp-1 mt-1">
          {turf.description}
        </p>

        <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-3">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">
            {[turf.location.city, turf.location.state].filter(Boolean).join(', ') || 'Location not set'}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {turf.sportsOffered.slice(0, 3).map((sport, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium"
            >
              {sport}
            </span>
          ))}
          {turf.sportsOffered.length > 3 && (
            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs font-medium">
              +{turf.sportsOffered.length - 3}
            </span>
          )}
        </div>

        {stats && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs text-gray-500">
                  {stats.pending} pending
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-gray-500">
                  {stats.confirmed} confirmed
                </span>
              </div>
              <div className="text-xs text-gray-400 ml-auto">
                {stats.total} total
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all h-9 text-xs font-medium"
            onClick={onViewBookings}
          >
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Bookings
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all h-9 text-xs font-medium"
            onClick={onEdit}
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all h-9 w-9 p-0"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────
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
          monthlyRevenue += booking.totalAmount || 0;
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
    if (!confirm('Are you sure you want to delete this turf? This action cannot be undone.')) return;

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
        toast.error('Failed to delete turf');
      }
    } catch (error) {
      console.error('Error deleting turf:', error);
      toast.error('Error deleting turf');
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
            toast.error('Basic plan: max 1 turf. Upgrade to add more.');
            return;
          }
          if ((plan === 'premium' || plan === 'pro') && turfs.length >= 3) {
            toast.error('Premium plan: max 3 turfs. Contact support for more.');
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
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
          </div>
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
          <p className="text-xs text-gray-400 mt-1">Fetching your turfs and bookings</p>
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
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-base font-bold shadow-md">
                    {(user.name || 'O').charAt(0).toUpperCase()}
                  </div>
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-semibold text-gray-900 leading-none">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {user.businessName || 'Turf Owner'}
                    </p>
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
                <DropdownMenuLabel className="font-semibold text-gray-900 px-3 py-2">
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={() => router.push('/owner/profile')} className="cursor-pointer rounded-lg px-3 py-2.5 transition-colors focus:bg-emerald-50 focus:text-emerald-700">
                  <UserIcon className="mr-3 h-5 w-5" />
                  <span className="text-base">My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/owner/bank-details')} className="cursor-pointer rounded-lg px-3 py-2.5 transition-colors focus:bg-emerald-50 focus:text-emerald-700">
                  <CreditCard className="mr-3 h-5 w-5" />
                  <span className="text-base">Payment Details</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/owner/analytics')} className="cursor-pointer rounded-lg px-3 py-2.5 transition-colors focus:bg-emerald-50 focus:text-emerald-700">
                  <BarChart3 className="mr-3 h-5 w-5" />
                  <span className="text-base">Analytics</span>
                </DropdownMenuItem>
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 sm:pb-24">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {greeting}, {user.name?.split(' ')[0]}!
                </h1>
                <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 text-[10px]">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Dashboard
                </Badge>
              </div>
              <p className="text-emerald-200 text-sm">
                Manage your turf facilities and bookings from one place.
              </p>
            </div>
            <Button
              onClick={handleAddTurf}
              className="bg-white text-emerald-700 hover:bg-gray-100 rounded-xl h-11 px-6 font-semibold shadow-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Turf
            </Button>
          </div>
        </div>
      </div>

      {/* ─────────── MAIN CONTENT ─────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-12">

        {/* Verification Alerts */}
        {user.verificationStatus === 'pending' && (
          <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-800 text-sm">Verification Pending</h3>
              <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                Your account is awaiting admin verification. You can list turfs once approved.
              </p>
            </div>
          </div>
        )}

        {user.verificationStatus === 'rejected' && (
          <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800 text-sm">Application Rejected</h3>
              <p className="text-xs text-red-600 mt-1">
                Reason: {user.rejectionReason || 'No reason provided'}. Contact support to reapply.
              </p>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            icon={<Building className="h-5 w-5" />}
            iconGradient="from-emerald-500 to-green-600"
            label="Total Turfs"
            value={String(dashboardStats.totalTurfs)}
            subtext={
              dashboardStats.totalTurfs === 0
                ? 'No turfs added yet'
                : `${turfs.filter((t) => t.isActive).length} active`
            }
          />
          <StatCard
            icon={<CalendarCheck className="h-5 w-5" />}
            iconGradient="from-green-500 to-teal-500"
            label="Total Bookings"
            value={String(dashboardStats.totalBookings)}
            subtext={`${dashboardStats.confirmedBookings} confirmed · ${dashboardStats.pendingBookings} pending`}
            trend={dashboardStats.totalBookings > 0 ? 'up' : 'neutral'}
            trendValue={dashboardStats.totalBookings > 0 ? `${dashboardStats.confirmedBookings} ✓` : '—'}
          />
          <StatCard
            icon={<IndianRupee className="h-5 w-5" />}
            iconGradient="from-teal-500 to-cyan-500"
            label="Monthly Revenue"
            value={`₹${dashboardStats.monthlyRevenue.toLocaleString('en-IN')}`}
            subtext="This month's confirmed earnings"
            trend={dashboardStats.monthlyRevenue > 0 ? 'up' : 'neutral'}
            trendValue={dashboardStats.monthlyRevenue > 0 ? 'This month' : '—'}
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            iconGradient="from-cyan-500 to-sky-500"
            label="Active Bookings"
            value={String(dashboardStats.activeBookings)}
            subtext="Upcoming confirmed bookings"
            trend={dashboardStats.activeBookings > 0 ? 'up' : 'neutral'}
            trendValue={dashboardStats.activeBookings > 0 ? 'Live' : '—'}
          />
        </div>

        {/* My Turfs Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">My Turfs</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {turfs.length} {turfs.length === 1 ? 'facility' : 'facilities'} listed
              </p>
            </div>
            {turfs.length > 0 && (
              <Button
                onClick={handleAddTurf}
                variant="outline"
                size="sm"
                className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-9 px-4 text-xs font-medium"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Turf
              </Button>
            )}
          </div>

          {turfs.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 sm:p-14 text-center">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <Building className="h-9 w-9 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">No turfs added yet</h3>
              <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
                Get started by adding your first turf facility. Set pricing,
                availability, and start receiving bookings from players.
              </p>
              <Button
                onClick={handleAddTurf}
                className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 px-6 font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Turf
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {turfs.map((turf) => (
                <TurfCard
                  key={turf._id}
                  turf={turf}
                  stats={bookingStats[turf._id]}
                  deleting={deleting === turf._id}
                  onDelete={() => handleDeleteTurf(turf._id)}
                  onEdit={() => router.push(`/dashboard/turf-owner?turfId=${turf._id}`)}
                  onViewBookings={() => router.push(`/owner/bookings?turfId=${turf._id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Getting Started Guide */}
        {turfs.length === 0 && (
          <div className="mt-6">
            <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-emerald-200" />
                  <h3 className="text-lg font-bold text-white">Getting Started</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { step: '01', title: 'Add your turf', desc: 'Upload photos, set location and sports' },
                    { step: '02', title: 'Set pricing', desc: 'Configure hourly rates and discounts' },
                    { step: '03', title: 'Set availability', desc: 'Define your operating hours and slots' },
                    { step: '04', title: 'Start earning', desc: 'Receive and manage bookings' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <span className="text-emerald-200 text-xs font-bold">STEP {item.step}</span>
                      <h4 className="text-white font-semibold mt-1 text-sm">{item.title}</h4>
                      <p className="text-emerald-100 text-xs mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        {turfs.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: <BarChart3 className="h-5 w-5" />,
                label: 'View Analytics',
                desc: 'Track performance and trends',
                href: '/owner/analytics',
                gradient: 'from-emerald-500 to-green-600',
              },
              {
                icon: <Calendar className="h-5 w-5" />,
                label: 'All Bookings',
                desc: 'Manage upcoming bookings',
                href: '/owner/bookings',
                gradient: 'from-green-500 to-teal-500',
              },
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
        )}
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <ProtectedRoute requireRole="owner">
      <OwnerDashboard />
    </ProtectedRoute>
  );
}