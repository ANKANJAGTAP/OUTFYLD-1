"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useHoverDropdown } from "@/hooks/useHoverDropdown";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronDown,
  Sparkles,
  Activity,
  Target,
  IndianRupee,
  Zap,
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
import { NightShell } from "@/components/night/NightShell";
import { NightLoader } from "@/components/night/NightLoader";
import { Mono, nightCard, nightPrimaryBtn, nightGhostBtn } from "@/components/night/ui";
import { CountUp } from "@/components/landing/night-match/CountUp";
import { Reveal } from "@/components/landing/night-match/Reveal";
import { PitchDivider } from "@/components/landing/night-match/PitchDivider";

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
  time: string;
  bookings: number;
  totalSlots: number;
  rate: number;
  barClass: string;
}

// ─── Night palette for charts ────────────────────────────────────────
const CHART = {
  lime: "#C8F135",
  chalk: "#9AA79F",
  grid: "#1F2D26",
  red: "#B91C1C",
  page: "#080B0A",
};

// ─── Stat tile ───────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  subtext,
  trend,
  trendValue,
}: {
  label: string;
  value: React.ReactNode;
  subtext: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}) {
  return (
    <div className={`${nightCard} p-5 sm:p-6`}>
      <div className="flex items-start justify-between gap-3">
        <p className="nm-overline text-chalk-400">{label}</p>
        {trend && trendValue && (
          <span
            className={`flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] ${
              trend === "up"
                ? "text-flood-500"
                : trend === "down"
                  ? "text-red-500"
                  : "text-chalk-400"
            }`}
          >
            {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
            {trend === "down" && <ArrowDownRight className="h-3 w-3" />}
            {trendValue}
          </span>
        )}
      </div>
      <div className="mt-4 font-mono text-2xl tabular-nums tracking-tight text-chalk-100 sm:text-3xl">
        {value}
      </div>
      <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
        {subtext}
      </p>
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
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 border border-pitchline bg-pitch-900 font-mono text-chalk-100 text-[10px] px-2 py-1 rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {type === "bookings"
                  ? `${val} bookings`
                  : `₹${val.toLocaleString("en-IN")}`}
              </div>

              {/* Bar */}
              <div
                className={`w-full rounded-t-[2px] transition-all duration-500 ease-night cursor-pointer ${
                  isEmpty
                    ? "bg-pitch-800"
                    : "bg-flood-500 opacity-80 hover:opacity-100 hover:shadow-flood"
                }`}
                style={{
                  height: isEmpty ? "4px" : `${Math.max(heightPercent, 8)}%`,
                }}
              />

              {/* Label */}
              <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-chalk-400">
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
            stroke={CHART.grid}
            strokeWidth="0.3"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGradient)" opacity="0.3" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={CHART.lime}
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
            fill={CHART.lime}
            stroke={CHART.page}
            strokeWidth="0.5"
          />
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.lime} stopOpacity="0.4" />
            <stop offset="100%" stopColor={CHART.lime} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between px-1 mt-1">
        {data.map((d, i) => (
          <span key={i} className="font-mono text-[9px] uppercase tracking-[0.06em] text-chalk-400">
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
            stroke={CHART.grid}
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
                  className="transition-all duration-700 ease-night"
                />
              );
            })}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Mono className="text-lg text-chalk-100">{total}</Mono>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-chalk-400">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 min-w-32">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-400">{seg.label}</span>
            <Mono className="ml-auto text-xs text-chalk-100">{seg.value}</Mono>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Insight row ─────────────────────────────────────────────────────

function InsightCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-pitchline/60 px-5 py-4 transition-colors duration-200 ease-night last:border-0 hover:bg-white/[0.03]">
      <span className="mt-0.5 shrink-0 text-flood-500">{icon}</span>
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-100">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-chalk-400">
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

// ─── Chart header (overline treatment, no icon squares) ─────────────

function PanelHeader({
  title,
  caption,
  right,
}: {
  title: string;
  caption: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pitchline/60 px-6 py-5">
      <div>
        <p className="nm-overline text-chalk-400">{caption}</p>
        <h3 className="mt-1 font-display text-xl uppercase tracking-tight text-chalk-100">
          {title}
        </h3>
      </div>
      {right}
    </div>
  );
}

// ─── Main Analytics Component — MATCH ANALYSIS ───────────────────────

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
        time: "6 AM – 12 PM",
        bookings: periodCounts.morning,
        totalSlots: totalSlotsPerPeriod,
        rate:
          totalSlotsPerPeriod > 0
            ? Math.round((periodCounts.morning / totalSlotsPerPeriod) * 100)
            : 0,
        barClass: "bg-flood-500",
      },
      {
        period: "Afternoon",
        time: "12 PM – 6 PM",
        bookings: periodCounts.afternoon,
        totalSlots: totalSlotsPerPeriod,
        rate:
          totalSlotsPerPeriod > 0
            ? Math.round((periodCounts.afternoon / totalSlotsPerPeriod) * 100)
            : 0,
        barClass: "bg-flood-500/80",
      },
      {
        period: "Night",
        time: "6 PM – 12 AM",
        bookings: periodCounts.night,
        totalSlots: totalSlotsPerPeriod,
        rate:
          totalSlotsPerPeriod > 0
            ? Math.round((periodCounts.night / totalSlotsPerPeriod) * 100)
            : 0,
        barClass: "bg-flood-500/60",
      },
      {
        period: "Midnight",
        time: "12 AM – 6 AM",
        bookings: periodCounts.midnight,
        totalSlots: totalSlotsPerPeriod,
        rate:
          totalSlotsPerPeriod > 0
            ? Math.round((periodCounts.midnight / totalSlotsPerPeriod) * 100)
            : 0,
        barClass: "bg-chalk-400/40",
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
      <NightShell ambient={0.45}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="max-w-md px-6 text-center">
            <BarChart3 className="mx-auto h-8 w-8 text-flood-500" />
            <p className="nm-overline mt-6 text-flood-500">Season pass required</p>
            <h2 className="mt-2 font-display text-3xl uppercase tracking-tight text-chalk-100">
              Premium Feature
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-chalk-400">
              Analytics is available for Premium and Pro plan members only.
              Upgrade your plan to access detailed insights.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => router.push("/owner/subscription")}
                className={nightPrimaryBtn}
              >
                Upgrade Plan
              </button>
              <button
                onClick={() => router.push("/owner/dashboard")}
                className={nightGhostBtn}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </NightShell>
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
      <NightShell ambient={0.45}>
        <div className="flex min-h-screen items-center justify-center">
          <NightLoader label="Crunching the numbers…" />
        </div>
      </NightShell>
    );
  }

  return (
    <NightShell ambient={0.45}>
      {/* ─────────── HEADER (same as dashboard, restyled in place) ─────────── */}
      <header className="sticky top-0 z-50 border-b border-pitchline bg-pitch-900/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
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
                { label: "Home", href: "/" },
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
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
                Analytics
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
                    {(user.name || "O").charAt(0).toUpperCase()}
                  </div>

                  <div className="hidden text-right lg:block">
                    <p className="text-sm font-semibold leading-none text-chalk-100">
                      {user.name}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-400">
                      {user.businessName || "Arena Owner"}
                    </p>
                  </div>
                  {user.subscriptionPlan && (
                    <span className="hidden rounded-[4px] border border-flood-500/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-flood-500 md:inline-flex">
                      {user.subscriptionPlan.charAt(0).toUpperCase() +
                        user.subscriptionPlan.slice(1)}
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
                <DropdownMenuItem
                  onClick={() => router.push("/owner/profile")}
                  className="cursor-pointer rounded-[4px] px-3 py-2.5 transition-colors"
                >
                  <User className="mr-3 h-5 w-5" />
                  <span className="text-base">My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/owner/bank-details")}
                  className="cursor-pointer rounded-[4px] px-3 py-2.5 transition-colors"
                >
                  <CreditCard className="mr-3 h-5 w-5" />
                  <span className="text-base">Payment Details</span>
                </DropdownMenuItem>
                {(user.subscriptionPlan === "premium" ||
                  user.subscriptionPlan === "pro") && (
                  <DropdownMenuItem
                    onClick={() => router.push("/owner/analytics")}
                    className="cursor-pointer rounded-[4px] px-3 py-2.5 transition-colors"
                  >
                    <BarChart3 className="mr-3 h-5 w-5" />
                    <span className="text-base">Analytics</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer rounded-[4px] px-3 py-2.5 text-red-500 transition-colors focus:text-red-400"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  <span className="text-base font-medium">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ─────────── TITLE — MATCH ANALYSIS ─────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <Reveal>
          <Link
            href="/owner/dashboard"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
          >
            ← Manager&apos;s office
          </Link>
          <div className="mt-8">
            <p className="nm-overline mb-3 text-flood-500">Match analysis</p>
            <h1 className="nm-display-l text-chalk-100">
              The Numbers Room
            </h1>
            <p className="mt-4 max-w-lg text-sm text-chalk-400">
              {greeting}
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}. Track your
              turf performance and bookings.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ─────────── CONTENT ─────────── */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Stat tiles */}
        <Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            <StatTile
              label="Total Revenue"
              value={<CountUp value={analytics.totalRevenue} prefix="₹" />}
              subtext={`₹${analytics.monthlyRevenue.toLocaleString("en-IN")} this month`}
              trend={analytics.revenueTrend}
              trendValue={
                analytics.revenueChangePercent !== 0
                  ? `${analytics.revenueChangePercent > 0 ? "+" : ""}${analytics.revenueChangePercent}%`
                  : "—"
              }
            />
            <StatTile
              label="Total Bookings"
              value={<CountUp value={analytics.totalBookings} />}
              subtext={`${analytics.confirmedBookings} confirmed · ${analytics.pendingBookings} pending`}
              trend={analytics.bookingTrend}
              trendValue={
                analytics.monthlyBookings > 0
                  ? `${analytics.monthlyBookings} this month`
                  : "—"
              }
            />
            <StatTile
              label="Unique Players"
              value={<CountUp value={analytics.uniqueCustomers} />}
              subtext="Distinct customers who booked"
              trend={analytics.uniqueCustomers > 0 ? "up" : "neutral"}
              trendValue={analytics.uniqueCustomers > 0 ? "Active" : "—"}
            />
            <StatTile
              label="Busiest Day"
              value={
                <span className="font-display text-2xl uppercase tracking-tight sm:text-3xl">
                  {analytics.busiestDay}
                </span>
              }
              subtext={
                analytics.busiestDayCount > 0
                  ? `${analytics.busiestDayCount} bookings on ${analytics.busiestDay}s`
                  : "No data yet"
              }
            />
          </div>
        </Reveal>

        {/* Charts Grid */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Bar Chart */}
          <Reveal className="lg:col-span-2">
            <div className={`${nightCard} overflow-hidden`}>
              <PanelHeader
                caption={`Last ${chartView === "week" ? "7 days" : "30 days"}`}
                title={barType === "bookings" ? "Daily Bookings" : "Daily Revenue"}
                right={
                  <div className="flex items-center gap-2">
                    {(["bookings", "revenue"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setBarType(t)}
                        className={`rounded-[4px] border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-200 ease-night ${
                          barType === t
                            ? "border-flood-500/60 text-flood-500"
                            : "border-transparent text-chalk-400 hover:text-chalk-100"
                        }`}
                      >
                        {t === "bookings" ? "Bookings" : "Revenue"}
                      </button>
                    ))}
                    <div className="mx-1 h-4 w-px bg-pitchline" />
                    {(["week", "month"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setChartView(v)}
                        className={`rounded-[4px] border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-200 ease-night ${
                          chartView === v
                            ? "border-flood-500/60 text-flood-500"
                            : "border-transparent text-chalk-400 hover:text-chalk-100"
                        }`}
                      >
                        {v === "week" ? "Week" : "Month"}
                      </button>
                    ))}
                  </div>
                }
              />
              <div className="p-6">
                <BarChart data={analytics.dailyChartData} type={barType} />
              </div>
            </div>
          </Reveal>

          {/* Booking Status Donut */}
          <Reveal delay={0.08}>
            <div className={`${nightCard} overflow-hidden`}>
              <PanelHeader caption="All-time breakdown" title="Booking Status" />
              <div className="flex items-center justify-center p-6">
                <DonutChart
                  segments={[
                    {
                      label: "Confirmed",
                      value: analytics.confirmedBookings,
                      color: CHART.lime,
                    },
                    {
                      label: "Pending",
                      value: analytics.pendingBookings,
                      color: CHART.chalk,
                    },
                    {
                      label: "Cancelled",
                      value: analytics.cancelledBookings,
                      color: CHART.red,
                    },
                  ]}
                />
              </div>
            </div>
          </Reveal>
        </div>

        {/* Revenue Line Chart + Insights */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Revenue Trend Line */}
          <Reveal className="lg:col-span-2">
            <div className={`${nightCard} overflow-hidden`}>
              <PanelHeader
                caption={`Last ${chartView === "week" ? "7 days" : "30 days"}`}
                title="Revenue Trend"
                right={
                  <Mono className="text-xl text-flood-500">
                    ₹{analytics.monthlyRevenue.toLocaleString("en-IN")}
                  </Mono>
                }
              />
              <div className="p-6">
                <LineChart data={analytics.dailyChartData} />
              </div>
            </div>
          </Reveal>

          {/* Insights */}
          <Reveal delay={0.08}>
            <div className={`${nightCard} overflow-hidden`}>
              <PanelHeader caption="Tips to boost performance" title="Quick Insights" />
              <div>
                <InsightCard
                  icon={<Target className="h-4 w-4" />}
                  title="Set Dynamic Pricing"
                  description="Enable discounts for off-peak hours to attract more bookings."
                />
                <InsightCard
                  icon={<Clock className="h-4 w-4" />}
                  title="Peak Hours"
                  description="Most bookings happen between 6 PM – 10 PM on weekdays."
                />
                <InsightCard
                  icon={<Activity className="h-4 w-4" />}
                  title="Keep Slots Updated"
                  description="Turfs with accurate availability get 2x more views."
                />
                <InsightCard
                  icon={<Sparkles className="h-4 w-4" />}
                  title="Add More Photos"
                  description="Turfs with 4+ images receive 60% more bookings."
                />
              </div>
            </div>
          </Reveal>
        </div>

        <PitchDivider className="my-6" flag="left" />

        {/* Revenue Breakdown + Occupancy */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Revenue Breakdown */}
          <Reveal>
            <div className={`${nightCard} overflow-hidden`}>
              <PanelHeader
                caption="All-time earnings summary"
                title="Club Treasury"
                right={<IndianRupee className="h-4 w-4 text-flood-500" />}
              />
              <div className="p-6">
                {[
                  {
                    label: "Total Bookings Revenue",
                    amount: `₹${analytics.totalRevenue.toLocaleString("en-IN")}`,
                    dotClass: "bg-flood-500",
                  },
                  {
                    label: "Platform Commission (~10%)",
                    amount: `-₹${analytics.commission.toLocaleString("en-IN")}`,
                    dotClass: "bg-chalk-400",
                  },
                  {
                    label: "Gateway Fees (~2%)",
                    amount: `-₹${analytics.gatewayFee.toLocaleString("en-IN")}`,
                    dotClass: "bg-chalk-400/50",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-pitchline/60 py-3 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-1.5 w-1.5 ${item.dotClass}`} />
                      <span className="text-sm text-chalk-400">{item.label}</span>
                    </div>
                    <Mono className="text-sm text-chalk-100">{item.amount}</Mono>
                  </div>
                ))}
                <div className="mt-4 flex items-center justify-between border-t border-pitchline pt-4">
                  <span className="nm-overline text-chalk-100">Net Earnings</span>
                  <Mono className="text-xl text-flood-500">
                    ₹{analytics.netEarnings.toLocaleString("en-IN")}
                  </Mono>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Occupancy by Period */}
          <Reveal delay={0.08}>
            <div className={`${nightCard} overflow-hidden`}>
              <PanelHeader
                caption="Estimated slot fill rate"
                title="Occupancy by Period"
                right={<Zap className="h-4 w-4 text-flood-500" />}
              />
              <div className="space-y-5 p-6">
                {analytics.periodData.map((item, i) => (
                  <div key={i}>
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-100">
                          {item.period}
                        </span>
                        <span className="ml-2 font-mono text-[10px] text-chalk-400">
                          {item.time}
                        </span>
                      </div>
                      <div className="text-right">
                        <Mono className="text-sm text-chalk-100">{item.rate}%</Mono>
                        <span className="ml-1.5 font-mono text-[10px] text-chalk-400">
                          ({item.bookings})
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-[2px] bg-pitch-800">
                      <div
                        className={`h-full rounded-[2px] ${item.barClass} transition-all duration-700 ease-night`}
                        style={{ width: `${Math.max(item.rate, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </NightShell>
  );
}

export default function OwnerAnalyticsPage() {
  return (
    <ProtectedRoute requireRole="owner">
      <AnalyticsOverview />
    </ProtectedRoute>
  );
}
