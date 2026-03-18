'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Award, Gift, Trophy, Star, History, Calendar,
  Info, ChevronRight, Loader2, Search, ArrowUpRight,
  ArrowDownRight, Sparkles, Zap, Target, CheckCircle2,
  IndianRupee, ArrowRight, MessageSquare, Clock,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────

interface LoyaltyData {
  currentPoints: number;
  tier: string;
  pointsToNextTier: number;
  nextTier: string;
  progressValue: number;
  recentTransactions: {
    _id?: string;
    type: 'earned' | 'redeemed';
    amount: number;
    description: string;
    date: string;
  }[];
}

interface Transaction {
  id: string;
  type: 'earned' | 'redeemed';
  amount: string;
  rawAmount: number;
  description: string;
  date: string;
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
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-xs font-medium text-gray-700 mt-1">{label}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{subtext}</p>
    </div>
  );
}

// ─── Tier Badge ──────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  const tierConfig: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    Bronze: { color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200', icon: '🥉' },
    Silver: { color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-300', icon: '🥈' },
    Gold: { color: 'text-yellow-800', bg: 'bg-yellow-50', border: 'border-yellow-300', icon: '🥇' },
    Platinum: { color: 'text-violet-800', bg: 'bg-violet-50', border: 'border-violet-200', icon: '💎' },
  };

  const config = tierConfig[tier] || tierConfig.Bronze;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.color} ${config.border} border`}
    >
      <span>{config.icon}</span>
      {tier}
    </span>
  );
}

// ─── Transaction Row ─────────────────────────────────────────────────

function TransactionRow({ tx }: { tx: Transaction }) {
  const isEarned = tx.type === 'earned';

  return (
    <div className="group flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 transition-all duration-200">
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
            isEarned ? 'bg-emerald-50' : 'bg-amber-50'
          }`}
        >
          {isEarned ? (
            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-amber-600" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {tx.description}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">{tx.date}</p>
        </div>
      </div>
      <span
        className={`flex-shrink-0 text-sm font-bold ml-3 ${
          isEarned ? 'text-emerald-600' : 'text-amber-600'
        }`}
      >
        {tx.amount}
      </span>
    </div>
  );
}

// ─── Earn Method Card ────────────────────────────────────────────────

function EarnMethodCard({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  points,
  pointsColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  points: string;
  pointsColor: string;
}) {
  return (
    <div className="group flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all duration-200">
      <div className="flex items-center gap-3.5">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}
        >
          <div className={iconColor}>{icon}</div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
      <span
        className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${pointsColor}`}
      >
        {points}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

function PlayerLoyaltyContent() {
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLoyaltyData = async () => {
      try {
        const response = await fetch(`/api/loyalty/customer/${user.uid}`);
        const result = await response.json();
        if (result.success) {
          setLoyaltyData(result.data);
        }
      } catch (error) {
        console.error('Error fetching loyalty data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoyaltyData();
  }, [user]);

  const stats = useMemo(() => {
    if (!loyaltyData) {
      return {
        currentPoints: 0,
        tier: 'Bronze',
        pointsToNextTier: 0,
        nextTier: 'Silver',
        progressValue: 0,
        discountValue: 0,
        totalEarned: 0,
        totalRedeemed: 0,
      };
    }

    let totalEarned = 0;
    let totalRedeemed = 0;

    for (const tx of loyaltyData.recentTransactions || []) {
      if (tx.type === 'earned') totalEarned += tx.amount;
      else totalRedeemed += tx.amount;
    }

    return {
      currentPoints: loyaltyData.currentPoints || 0,
      tier: loyaltyData.tier || 'Bronze',
      pointsToNextTier: loyaltyData.pointsToNextTier || 0,
      nextTier: loyaltyData.nextTier || 'Silver',
      progressValue: loyaltyData.progressValue || 0,
      discountValue: Math.floor((loyaltyData.currentPoints || 0) / 10),
      totalEarned,
      totalRedeemed,
    };
  }, [loyaltyData]);

  const transactions = useMemo((): Transaction[] => {
    return (loyaltyData?.recentTransactions || []).map((tx, i) => ({
      id: tx._id || String(i),
      type: tx.type,
      amount: tx.type === 'earned' ? `+${tx.amount.toFixed(2)}` : `-${tx.amount.toFixed(2)}`,
      rawAmount: tx.amount,
      description: tx.description,
      date: new Date(tx.date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    }));
  }, [loyaltyData]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <LandingHeader />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
            </div>
            <p className="text-gray-500 font-medium">Loading rewards...</p>
            <p className="text-xs text-gray-400 mt-1">Fetching your loyalty data</p>
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
                  Loyalty Rewards
                </h1>
                <TierBadge tier={stats.tier} />
              </div>
              <p className="text-emerald-200 text-sm">
                Track your points, check your tier, and redeem rewards.
              </p>
            </div>

            <Link href="/browse">
              <Button className="bg-white text-emerald-700 hover:bg-gray-100 rounded-xl h-11 px-6 font-semibold shadow-xl transition-all duration-200">
                <Search className="h-4 w-4 mr-2" />
                Earn More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────── CONTENT ─────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-12">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={<Trophy className="h-5 w-5" />}
            iconGradient="from-amber-500 to-orange-500"
            label="Current Points"
            value={String(stats.currentPoints)}
            subtext={`${stats.tier} tier`}
          />
          <StatCard
            icon={<IndianRupee className="h-5 w-5" />}
            iconGradient="from-emerald-500 to-green-600"
            label="Available Discount"
            value={`₹${stats.discountValue}`}
            subtext="Redeem on bookings"
          />
          <StatCard
            icon={<ArrowUpRight className="h-5 w-5" />}
            iconGradient="from-green-500 to-teal-500"
            label="Total Earned"
            value={String(Number(stats.totalEarned).toFixed(2))}
            subtext="All-time earned"
          />
          <StatCard
            icon={<Gift className="h-5 w-5" />}
            iconGradient="from-teal-500 to-cyan-500"
            label="Total Redeemed"
            value={String(Number(stats.totalRedeemed).toFixed(2))}
            subtext="Points used"
          />
        </div>

        {/* ── Tier Progress Card ── */}
        <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Award className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-[15px]">Tier Progress</h3>
                <p className="text-xs text-gray-400 mt-0.5">Your journey to the next level</p>
              </div>
            </div>
            <TierBadge tier={stats.tier} />
          </div>

          <div className="p-6">
            {/* Points display */}
            <div className="flex items-end gap-2 mb-6">
              <span className="text-5xl font-extrabold text-emerald-700 tracking-tight">
                {stats.currentPoints}
              </span>
              <span className="text-lg text-emerald-500 font-medium mb-1.5">pts</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {stats.tier}
                </span>
                <span className="text-gray-400 flex items-center gap-1">
                  {stats.nextTier}
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(stats.progressValue, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                Earn{' '}
                <strong className="text-emerald-700">
                  {stats.pointsToNextTier} more points
                </strong>{' '}
                to unlock {stats.nextTier} tier benefits.
              </p>
            </div>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">

          {/* Left: Redeem + Ways to Earn */}
          <div className="space-y-5">

            {/* Redeem Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '16px 16px',
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="h-5 w-5 text-emerald-200" />
                  <span className="text-sm font-semibold">Use Your Points</span>
                </div>
                <p className="text-3xl font-bold">
                  ₹{stats.discountValue}
                </p>
                <p className="text-emerald-200 text-xs mt-1">Available discount value</p>
                <Separator className="my-4 bg-white/20" />
                <div className="flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-emerald-200 mt-0.5 flex-shrink-0" />
                  <p className="text-emerald-100 text-xs leading-relaxed">
                    Apply your loyalty points for a discount during checkout on your next booking.
                  </p>
                </div>
                <Link href="/browse" className="block mt-4">
                  <Button
                    size="sm"
                    className="w-full bg-white/20 hover:bg-white/30 text-white rounded-xl h-9 text-xs font-semibold backdrop-blur-sm border border-white/10"
                  >
                    Book & Redeem
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Ways to Earn */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px]">Ways to Earn</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Earn points with every action</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <EarnMethodCard
                  icon={<Calendar className="h-4 w-4" />}
                  iconBg="bg-emerald-50"
                  iconColor="text-emerald-600"
                  title="Book a Turf"
                  description="10 points per ₹100 spent"
                  points="+ Variable"
                  pointsColor="bg-emerald-50 text-emerald-700 border border-emerald-200"
                />
                <EarnMethodCard
                  icon={<MessageSquare className="h-4 w-4" />}
                  iconBg="bg-amber-50"
                  iconColor="text-amber-600"
                  title="Leave a Review"
                  description="Share your experience"
                  points="+50 pts"
                  pointsColor="bg-amber-50 text-amber-700 border border-amber-200"
                />
                <EarnMethodCard
                  icon={<Star className="h-4 w-4" />}
                  iconBg="bg-teal-50"
                  iconColor="text-teal-600"
                  title="Refer a Friend"
                  description="When they complete first booking"
                  points="+100 pts"
                  pointsColor="bg-teal-50 text-teal-700 border border-teal-200"
                />
              </div>
            </div>
          </div>

          {/* Right: Transaction History */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <History className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">Points History</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Recent transactions</p>
                </div>
              </div>
              {transactions.length > 0 && (
                <span className="text-xs text-gray-400">
                  {transactions.length} transactions
                </span>
              )}
            </div>

            <div className="p-2">
              {transactions.length > 0 ? (
                transactions.map((tx, i) => (
                  <div key={tx.id}>
                    <TransactionRow tx={tx} />
                    {i < transactions.length - 1 && <Separator className="mx-4" />}
                  </div>
                ))
              ) : (
                <div className="text-center py-14 px-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-7 w-7 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">No transactions yet</h3>
                  <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto">
                    Start earning points by booking turfs and leaving reviews!
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
              )}
            </div>
          </div>
        </div>

        {/* ── Tier Benefits ── */}
        <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-[15px]">Tier Benefits</h3>
                <p className="text-xs text-gray-400 mt-0.5">Unlock perks as you level up</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  tier: 'Bronze',
                  emoji: '🥉',
                  points: '0+',
                  perks: ['Earn 10 pts/₹100', 'Basic rewards'],
                  gradient: 'from-amber-100 to-orange-50',
                  border: 'border-amber-200',
                  active: stats.tier === 'Bronze',
                },
                {
                  tier: 'Silver',
                  emoji: '🥈',
                  points: '1000+',
                  perks: ['Earn 12 pts/₹100', 'Priority booking'],
                  gradient: 'from-gray-100 to-gray-50',
                  border: 'border-gray-300',
                  active: stats.tier === 'Silver',
                },
                {
                  tier: 'Gold',
                  emoji: '🥇',
                  points: '2000+',
                  perks: ['Earn 15 pts/₹100', 'Exclusive offers'],
                  gradient: 'from-yellow-100 to-amber-50',
                  border: 'border-yellow-300',
                  active: stats.tier === 'Gold',
                },
                {
                  tier: 'Platinum',
                  emoji: '💎',
                  points: '5000+',
                  perks: ['Earn 20 pts/₹100', 'VIP support'],
                  gradient: 'from-violet-100 to-purple-50',
                  border: 'border-violet-200',
                  active: stats.tier === 'Platinum',
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className={`relative rounded-xl bg-gradient-to-br ${t.gradient} border ${t.border} p-4 ${
                    t.active ? 'ring-2 ring-emerald-400 ring-offset-2' : ''
                  }`}
                >
                  {t.active && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </span>
                  )}
                  <div className="text-xl mb-2">{t.emoji}</div>
                  <h4 className="font-bold text-gray-900 text-sm">{t.tier}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">{t.points} points</p>
                  <ul className="mt-3 space-y-1.5">
                    {t.perks.map((perk, j) => (
                      <li key={j} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                        <span className="w-1 h-1 rounded-full bg-gray-400" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayerLoyaltyPage() {
  return (
    <ProtectedRoute requireRole="customer">
      <PlayerLoyaltyContent />
    </ProtectedRoute>
  );
}