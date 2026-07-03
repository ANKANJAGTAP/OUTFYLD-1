"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useHoverDropdown } from "@/hooks/useHoverDropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Clock,
  CalendarCheck,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Activity,
  Target,
  Zap,
  LayoutDashboard,
  ArrowRight,
  Settings,
  RefreshCw,
  Info,
  Loader2,
  LogOut,
  User,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ───────────────────────────────────────────────────────────

interface Booking {
  _id: string;
  turfId: string | { _id: string };
  customerId: string | { _id: string };
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
  pricing: number;
  isActive: boolean;
  rating?: number;
  reviewCount?: number;
}

interface DailyData {
  date: string;
  label: string;
  bookings: number;
  revenue: number;
}

interface PeriodData {
  period: string;
  emoji: string;
  time: string;
  bookings: number;
  totalSlots: number;
  rate: number;
  color: string;
}

// ─── Stat Card ───────────────────────────────────────────────────────

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
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}) {
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 hover:shadow-lg hover:shadow-emerald-50 hover:border-emerald-100 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
        {trend && trendValue && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              trend === "up"
                ? "bg-emerald-50 text-emerald-700"
                : trend === "down"
                  ? "bg-red-50 text-red-600"
                  : "bg-gray-50 text-gray-500"
            }`}
          >
            {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
            {trend === "down" && <ArrowDownRight className="h-3 w-3" />}
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

// ─── Bar Chart Component (Pure CSS) ──────────────────────────────────

function BarChart({
  data,
  type,
}: {
  data: DailyData[];
  type: "bookings" | "revenue";
}) {
  const values = data.map((d) =>
    type === "bookings" ? d.bookings : d.revenue,
  );
  const maxVal = Math.max(...values, 1);

  return (
    <div>
      <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-40 px-1">
        {data.map((d, i) => {
          const val = type === "bookings" ? d.bookings : d.revenue;
          const heightPercent = (val / maxVal) * 100;
          const isEmpty = val === 0;

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1.5 group relative"
            >
              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {type === "bookings"
                  ? `${val} bookings`
                  : `₹${val.toLocaleString("en-IN")}`}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
              </div>

              {/* Bar */}
              <div
                className={`w-full rounded-t-md transition-all duration-500 cursor-pointer ${
                  isEmpty
                    ? "bg-gray-100"
                    : "bg-gradient-to-t from-emerald-500 to-green-400 opacity-80 hover:opacity-100"
                }`}
                style={{
                  height: isEmpty ? "4px" : `${Math.max(heightPercent, 8)}%`,
                }}
              />

              {/* Label */}
              <span className="text-[10px] text-gray-400 font-medium">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Line Chart Component (SVG) ──────────────────────────────────────

function LineChart({ data }: { data: DailyData[] }) {
  const values = data.map((d) => d.revenue);
  const maxVal = Math.max(...values, 1);
  const width = 100;
  const height = 40;
  const padding = 2;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - (v / maxVal) * (height - padding * 2);
    return { x, y, value: v };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-24"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={padding}
            y1={height - padding - frac * (height - padding * 2)}
            x2={width - padding}
            y2={height - padding - frac * (height - padding * 2)}
            stroke="#f3f4f6"
            strokeWidth="0.3"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGradient)" opacity="0.3" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#10b981"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.2"
            fill="#10b981"
            stroke="white"
            strokeWidth="0.5"
          />
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between px-1 mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] text-gray-400 font-medium">
            {i % 2 === 0 || data.length <= 7 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Donut Chart Component (SVG) ─────────────────────────────────────

function DonutChart({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 40;
  const cx = 50;
  const cy = 50;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />

          {/* Segments */}
          {total > 0 &&
            segments.map((seg, i) => {
              const percent = seg.value / total;
              const dashArray = `${circumference * percent} ${circumference * (1 - percent)}`;
              const dashOffset = -circumference * cumulativePercent;
              cumulativePercent += percent;

              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              );
            })}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-900">{total}</span>
          <span className="text-[10px] text-gray-400">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-xs text-gray-600">{seg.label}</span>
            <span className="text-xs font-semibold text-gray-900 ml-auto">
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Insight Card ────────────────────────────────────────────────────

function InsightCard({
  icon,
  iconBg,
  iconColor,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200">
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}
      >
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

// ─── Helper: Get time period from hour ───────────────────────────────

function getTimePeriod(
  hour: number,
): "morning" | "afternoon" | "night" | "midnight" {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 24) return "night";
  return "midnight";
}

// ─── Main Analytics Component ────────────────────────────────────────

function AnalyticsOverview() {
  const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown();
  const { user, firebaseUser, logout } = useAuth();
  const router = useRouter();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<"week" | "month">("week");
  const [barType, setBarType] = useState<"bookings" | "revenue">("bookings");

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
          fetch("/api/turfs/manage", {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch(`/api/bookings/owner/${user.uid}`, {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
        ]);

        if (turfsRes.ok) {
          const d = await turfsRes.json();
          setTurfs(d.turfs || []);
        }
        if (bookingsRes.ok) {
          const d = await bookingsRes.json();
          setAllBookings(d.bookings || []);
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [firebaseUser, user]);

  useEffect(() => {
    if (
      user &&
      user.subscriptionPlan !== "premium" &&
      user.subscriptionPlan !== "pro"
    ) {
      router.replace("/owner/dashboard");
    }
  }, [user, router]);

  // ── Compute all analytics from real data ──
  const analytics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Previous month for comparison
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let totalBookings = 0;
    let confirmedBookings = 0;
    let pendingBookings = 0;
    let cancelledBookings = 0;
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let prevMonthRevenue = 0;
    let monthlyBookings = 0;
    let prevMonthBookings = 0;
    const uniqueCustomers = new Set<string>();

    // Daily data for charts
    const dailyMap = new Map<string, { bookings: number; revenue: number }>();

    // Period data
    const periodCounts: Record<string, number> = {
      morning: 0,
      afternoon: 0,
      night: 0,
      midnight: 0,
    };

    // Day of week data
    const dayOfWeekCounts: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    for (const booking of allBookings) {
      totalBookings++;

      // Customer tracking
      const custId =
        typeof booking.customerId === "object" && booking.customerId !== null
          ? (booking.customerId as any)._id?.toString() || ""
          : booking.customerId?.toString() || "";
      if (custId) uniqueCustomers.add(custId);

      if (booking.status === "confirmed") {
        confirmedBookings++;
        const amount = (booking.totalAmount || 0) 
          - (booking.promoDiscountAmount || 0) 
          - (booking.dynamicDiscountAmount || 0) 
          - (booking.loyaltyDiscountAmount || 0);
        totalRevenue += amount;

        const bookingDate = new Date(booking.createdAt || booking.slot?.date);
        const bMonth = bookingDate.getMonth();
        const bYear = bookingDate.getFullYear();

        if (bMonth === currentMonth && bYear === currentYear) {
          monthlyRevenue += amount;
          monthlyBookings++;
        }
        if (bMonth === prevMonth && bYear === prevYear) {
          prevMonthRevenue += amount;
          prevMonthBookings++;
        }

        // Daily tracking
        const dateKey =
          booking.slot?.date || bookingDate.toISOString().split("T")[0];
        const existing = dailyMap.get(dateKey) || { bookings: 0, revenue: 0 };
        existing.bookings++;
        existing.revenue += amount;
        dailyMap.set(dateKey, existing);

        // Period tracking
        if (booking.slot?.startTime) {
          const hour = parseInt(booking.slot.startTime.split(":")[0]);
          periodCounts[getTimePeriod(hour)]++;
        }

        // Day of week tracking
        if (booking.slot?.day) {
          dayOfWeekCounts[booking.slot.day] =
            (dayOfWeekCounts[booking.slot.day] || 0) + 1;
        }
      }

      if (
        booking.status === "pending" ||
        booking.status === "pending_payment"
      ) {
        pendingBookings++;
      }
      if (booking.status === "cancelled") {
        cancelledBookings++;
      }
    }

    // Revenue trend
    const revenueTrend: "up" | "down" | "neutral" =
      prevMonthRevenue > 0
        ? monthlyRevenue > prevMonthRevenue
          ? "up"
          : monthlyRevenue < prevMonthRevenue
            ? "down"
            : "neutral"
        : monthlyRevenue > 0
          ? "up"
          : "neutral";

    const revenueChangePercent =
      prevMonthRevenue > 0
        ? Math.round(
            ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100,
          )
        : monthlyRevenue > 0
          ? 100
          : 0;

    // Booking trend
    const bookingTrend: "up" | "down" | "neutral" =
      prevMonthBookings > 0
        ? monthlyBookings > prevMonthBookings
          ? "up"
          : monthlyBookings < prevMonthBookings
            ? "down"
            : "neutral"
        : monthlyBookings > 0
          ? "up"
          : "neutral";

    // Build daily chart data
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const numDays = chartView === "week" ? 7 : 30;
    const dailyChartData: DailyData[] = [];

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = dailyMap.get(ds) || { bookings: 0, revenue: 0 };
      dailyChartData.push({
        date: ds,
        label:
          chartView === "week"
            ? dayNames[d.getDay()]
            : `${d.getDate()} ${monthNames[d.getMonth()]}`,
        bookings: entry.bookings,
        revenue: entry.revenue,
      });
    }

    // Period fill rates (estimate ~6 slots per period per day per arena)
    const turfCount = Math.max(turfs.length, 1);
    const daysInMonth = 30;
    const slotsPerPeriodPerDay = 6 * turfCount;
    const totalSlotsPerPeriod = slotsPerPeriodPerDay * daysInMonth;

    const periodData: PeriodData[] = [
      {
        period: "Morning",
        emoji: "🌅",
        time: "6 AM – 12 PM",
        bookings: periodCounts.morning,
        totalSlots: totalSlotsPerPeriod,
        rate:
          totalSlotsPerPeriod > 0
            ? Math.round((periodCounts.morning / totalSlotsPerPeriod) * 100)
            : 0,
        color: "from-emerald-500 to-green-400",
      },
      {
        period: "Afternoon",
        emoji: "☀️",
        time: "12 PM – 6 PM",
        bookings: periodCounts.afternoon,
        totalSlots: totalSlotsPerPeriod,
        rate:
          totalSlotsPerPeriod > 0
            ? Math.round((periodCounts.afternoon / totalSlotsPerPeriod) * 100)
            : 0,
        color: "from-green-500 to-teal-400",
      },
      {
        period: "Night",
        emoji: "🌙",
        time: "6 PM – 12 AM",
        bookings: periodCounts.night,
        totalSlots: totalSlotsPerPeriod,
        rate:
          totalSlotsPerPeriod > 0
            ? Math.round((periodCounts.night / totalSlotsPerPeriod) * 100)
            : 0,
        color: "from-teal-500 to-cyan-400",
      },
      {
        period: "Midnight",
        emoji: "🌑",
        time: "12 AM – 6 AM",
        bookings: periodCounts.midnight,
        totalSlots: totalSlotsPerPeriod,
        rate:
          totalSlotsPerPeriod > 0
            ? Math.round((periodCounts.midnight / totalSlotsPerPeriod) * 100)
            : 0,
        color: "from-gray-400 to-gray-300",
      },
    ];

    // Find busiest day
    const busiestDay = Object.entries(dayOfWeekCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];

    // Average rating
    const ratedTurfs = turfs.filter((t) => t.rating && t.rating > 0);
    const avgRating =
      ratedTurfs.length > 0
        ? ratedTurfs.reduce((sum, t) => sum + (t.rating || 0), 0) /
          ratedTurfs.length
        : 0;

    // Platform commission estimate (10%)
    const commission = Math.round(totalRevenue * 0.1);
    const gatewayFee = Math.round(totalRevenue * 0.02);
    const netEarnings = totalRevenue - commission - gatewayFee;

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue,
      monthlyRevenue,
      prevMonthRevenue,
      revenueTrend,
      revenueChangePercent,
      monthlyBookings,
      bookingTrend,
      uniqueCustomers: uniqueCustomers.size,
      dailyChartData,
      periodData,
      busiestDay: busiestDay?.[0] || "N/A",
      busiestDayCount: busiestDay?.[1] || 0,
      avgRating,
      commission,
      gatewayFee,
      netEarnings,
    };
  }, [allBookings, turfs, chartView]);

  // Guards after all hooks have run, to satisfy the Rules of Hooks
  if (!user) return null;
  if (user.subscriptionPlan !== "premium" && user.subscriptionPlan !== "pro") {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-7 w-7 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Premium Feature</h2>
          <p className="text-sm text-gray-500 mt-2">
            Analytics is available for Premium and Pro plan members only.
            Upgrade your plan to access detailed insights.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button
              onClick={() => router.push("/owner/subscription")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 font-semibold shadow-lg shadow-emerald-200"
            >
              Upgrade Plan
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/owner/dashboard")}
              className="rounded-xl h-10 px-5 font-medium border-gray-200"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Greeting ──
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
          </div>
          <p className="text-gray-500 font-medium">Loading analytics...</p>
          <p className="text-xs text-gray-400 mt-1">Crunching your numbers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* ─────────── HEADER (same as dashboard) ─────────── */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
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
                { label: "Home", href: "/" },
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
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
                    {(user.name || "O").charAt(0).toUpperCase()}
                  </div>

                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-semibold text-gray-900 leading-none">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {user.businessName || "Arena Owner"}
                    </p>
                  </div>
                  {user.subscriptionPlan && (
                    <Badge className="hidden md:flex bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[10px] font-semibold tracking-wide">
                      {user.subscriptionPlan.charAt(0).toUpperCase() +
                        user.subscriptionPlan.slice(1)}
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
                <DropdownMenuItem
                  onClick={() => router.push("/owner/profile")}
                  className="cursor-pointer rounded-lg px-3 py-2.5 transition-colors focus:bg-emerald-50 focus:text-emerald-700"
                >
                  <User className="mr-3 h-5 w-5" />
                  <span className="text-base">My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/owner/bank-details")}
                  className="cursor-pointer rounded-lg px-3 py-2.5 transition-colors focus:bg-emerald-50 focus:text-emerald-700"
                >
                  <CreditCard className="mr-3 h-5 w-5" />
                  <span className="text-base">Payment Details</span>
                </DropdownMenuItem>
                {(user.subscriptionPlan === "premium" ||
                  user.subscriptionPlan === "pro") && (
                  <DropdownMenuItem
                    onClick={() => router.push("/owner/analytics")}
                    className="cursor-pointer rounded-lg px-3 py-2.5 transition-colors focus:bg-emerald-50 focus:text-emerald-700"
                  >
                    <BarChart3 className="mr-3 h-5 w-5" />
                    <span className="text-base">Analytics</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer rounded-lg px-3 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-700 transition-colors"
                >
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
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 sm:pb-24">
          <Link
            href="/owner/dashboard"
            className="text-sm text-white/70 hover:text-white flex items-center gap-1.5 transition-colors duration-200"
          >
            ← Dashboard
          </Link>
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Analytics Overview
              </h1>
              <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 text-[10px]">
                <Sparkles className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
            <p className="text-emerald-200 text-sm">
              {greeting}
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}. Track your
              turf performance and bookings.
            </p>
          </div>
        </div>
      </div>

      {/* ─────────── CONTENT ─────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-12">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            icon={<IndianRupee className="h-5 w-5" />}
            iconGradient="from-emerald-500 to-green-600"
            label="Total Revenue"
            value={`₹${analytics.totalRevenue.toLocaleString("en-IN")}`}
            subtext={`₹${analytics.monthlyRevenue.toLocaleString("en-IN")} this month`}
            trend={analytics.revenueTrend}
            trendValue={
              analytics.revenueChangePercent !== 0
                ? `${analytics.revenueChangePercent > 0 ? "+" : ""}${analytics.revenueChangePercent}%`
                : "—"
            }
          />
          <StatCard
            icon={<CalendarCheck className="h-5 w-5" />}
            iconGradient="from-green-500 to-teal-500"
            label="Total Bookings"
            value={String(analytics.totalBookings)}
            subtext={`${analytics.confirmedBookings} confirmed · ${analytics.pendingBookings} pending`}
            trend={analytics.bookingTrend}
            trendValue={
              analytics.monthlyBookings > 0
                ? `${analytics.monthlyBookings} this month`
                : "—"
            }
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            iconGradient="from-teal-500 to-cyan-500"
            label="Unique Players"
            value={String(analytics.uniqueCustomers)}
            subtext="Distinct customers who booked"
            trend={analytics.uniqueCustomers > 0 ? "up" : "neutral"}
            trendValue={analytics.uniqueCustomers > 0 ? "Active" : "—"}
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            iconGradient="from-cyan-500 to-sky-500"
            label="Busiest Day"
            value={analytics.busiestDay}
            subtext={
              analytics.busiestDayCount > 0
                ? `${analytics.busiestDayCount} bookings on ${analytics.busiestDay}s`
                : "No data yet"
            }
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">
                    {barType === "bookings"
                      ? "Daily Bookings"
                      : "Daily Revenue"}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Last {chartView === "week" ? "7 days" : "30 days"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(["bookings", "revenue"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setBarType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      barType === t
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                    }`}
                  >
                    {t === "bookings" ? "Bookings" : "Revenue"}
                  </button>
                ))}
                <div className="w-px h-4 bg-gray-200 mx-1" />
                {(["week", "month"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setChartView(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      chartView === v
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                    }`}
                  >
                    {v === "week" ? "Week" : "Month"}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6">
              <BarChart data={analytics.dailyChartData} type={barType} />
            </div>
          </div>

          {/* Booking Status Donut */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Target className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">
                    Booking Status
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    All-time breakdown
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 flex items-center justify-center">
              <DonutChart
                segments={[
                  {
                    label: "Confirmed",
                    value: analytics.confirmedBookings,
                    color: "#10b981",
                  },
                  {
                    label: "Pending",
                    value: analytics.pendingBookings,
                    color: "#f59e0b",
                  },
                  {
                    label: "Cancelled",
                    value: analytics.cancelledBookings,
                    color: "#ef4444",
                  },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Revenue Line Chart + Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
          {/* Revenue Trend Line */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">
                    Revenue Trend
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Last {chartView === "week" ? "7 days" : "30 days"}
                  </p>
                </div>
              </div>
              <span className="text-xl font-bold text-emerald-600">
                ₹{analytics.monthlyRevenue.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="p-6">
              <LineChart data={analytics.dailyChartData} />
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">
                    Quick Insights
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Tips to boost performance
                  </p>
                </div>
              </div>
            </div>
            <div className="p-2">
              <InsightCard
                icon={<Target className="h-4 w-4" />}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                title="Set Dynamic Pricing"
                description="Enable discounts for off-peak hours to attract more bookings."
              />
              <InsightCard
                icon={<Clock className="h-4 w-4" />}
                iconBg="bg-green-50"
                iconColor="text-green-600"
                title="Peak Hours"
                description="Most bookings happen between 6 PM – 10 PM on weekdays."
              />
              <InsightCard
                icon={<Activity className="h-4 w-4" />}
                iconBg="bg-teal-50"
                iconColor="text-teal-600"
                title="Keep Slots Updated"
                description="Turfs with accurate availability get 2x more views."
              />
              <InsightCard
                icon={<Sparkles className="h-4 w-4" />}
                iconBg="bg-cyan-50"
                iconColor="text-cyan-600"
                title="Add More Photos"
                description="Turfs with 4+ images receive 60% more bookings."
              />
            </div>
          </div>
        </div>

        {/* Revenue Breakdown + Occupancy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          {/* Revenue Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">
                    Revenue Breakdown
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    All-time earnings summary
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {[
                {
                  label: "Total Bookings Revenue",
                  amount: `₹${analytics.totalRevenue.toLocaleString("en-IN")}`,
                  color: "bg-emerald-500",
                },
                {
                  label: "Platform Commission (~10%)",
                  amount: `-₹${analytics.commission.toLocaleString("en-IN")}`,
                  color: "bg-amber-500",
                },
                {
                  label: "Gateway Fees (~2%)",
                  amount: `-₹${analytics.gatewayFee.toLocaleString("en-IN")}`,
                  color: "bg-gray-400",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${item.color}`}
                    />
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.amount}
                  </span>
                </div>
              ))}
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  Net Earnings
                </span>
                <span className="text-xl font-bold text-emerald-600">
                  ₹{analytics.netEarnings.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Occupancy by Period */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">
                    Occupancy by Period
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Estimated slot fill rate
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {analytics.periodData.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.emoji} {item.period}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {item.time}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-700">
                        {item.rate}%
                      </span>
                      <span className="text-xs text-gray-400 ml-1.5">
                        ({item.bookings})
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-700`}
                      style={{ width: `${Math.max(item.rate, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OwnerAnalyticsPage() {
  return (
    <ProtectedRoute requireRole="owner">
      <AnalyticsOverview />
    </ProtectedRoute>
  );
}