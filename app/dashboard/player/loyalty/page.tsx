'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightShell } from '@/components/night/NightShell';
import { CountUp } from '@/components/landing/night-match/CountUp';
import {
  Gift, Calendar, Info, Loader2, ArrowRight, MessageSquare, Star,
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

const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum'];

// ─── Main — THE TROPHY ROOM ──────────────────────────────────────────

function PlayerLoyaltyContent() {
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  // points roll-up + light sweep run once per session
  const [rolled, setRolled] = useState(true);

  useEffect(() => {
    setRolled(sessionStorage.getItem('nm-trophy-roll') === '1');
    sessionStorage.setItem('nm-trophy-roll', '1');
  }, []);

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
      amount: tx.type === 'earned' ? `+${tx.amount.toFixed(2)}` : `−${tx.amount.toFixed(2)}`,
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
      <NightShell ambient={0.6}>
        <LandingHeader />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-7 w-7 animate-spin text-flood-500" />
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-400">
              Opening the trophy room…
            </p>
          </div>
        </div>
      </NightShell>
    );
  }

  const tierIndex = Math.max(0, TIERS.indexOf(stats.tier));
  // overall position along the tier track: completed tiers + progress within current
  const trackPct = Math.min(
    100,
    (tierIndex / (TIERS.length - 1)) * 100 +
      (stats.progressValue / 100) * (100 / (TIERS.length - 1))
  );

  return (
    <NightShell ambient={0.6}>
      <LandingHeader />

      {/* ── POINTS HERO — huge Anton digits, one-shot roll + light sweep ── */}
      <section className="mx-auto max-w-5xl px-4 pb-4 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <Link
          href="/dashboard/player"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400 transition-colors hover:text-flood-500"
        >
          ← The tunnel
        </Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div className="relative overflow-hidden pr-6">
            <p className="nm-overline mb-2 text-chalk-400">The trophy room</p>
            <div
              className="relative font-display text-[clamp(4.5rem,14vw,9rem)] leading-none tracking-tight text-chalk-100"
              style={{ textShadow: '0 0 60px rgba(200,241,53,0.25)' }}
            >
              {rolled ? (
                stats.currentPoints.toLocaleString('en-IN')
              ) : (
                <CountUp value={stats.currentPoints} duration={1.4} />
              )}
              {/* one-shot light sweep */}
              {!rolled && (
                <span
                  aria-hidden
                  className="nm-sweep pointer-events-none absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-chalk-100/10 to-transparent"
                />
              )}
            </div>
            <p className="nm-overline mt-1 text-flood-500">
              {stats.tier} tier · points balance
            </p>
          </div>

          <div className="pb-3 text-right font-mono text-xs uppercase tracking-[0.14em] text-chalk-400">
            <p>
              <span className="text-flood-500">+{stats.totalEarned.toFixed(0)}</span> earned
            </p>
            <p className="mt-1">
              <span className="text-chalk-100">−{stats.totalRedeemed.toFixed(0)}</span> redeemed
            </p>
          </div>
        </div>
      </section>

      {/* ── TIER PROGRESS — the 4° pitch-line filling in lime ── */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative -rotate-[1.2deg]">
          <div className="mb-3 flex justify-between font-mono text-[9px] uppercase tracking-[0.16em]">
            {TIERS.map((t, i) => (
              <span key={t} className={i <= tierIndex ? 'text-flood-500' : 'text-chalk-400/60'}>
                {t}
              </span>
            ))}
          </div>
          <div className="relative h-[3px] w-full bg-pitchline">
            <div
              className="absolute inset-y-0 left-0 bg-flood-500 shadow-flood transition-[width] duration-700 ease-night"
              style={{ width: `${trackPct}%` }}
            />
            {/* corner-flag tick at the current position */}
            <div
              className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 bg-flood-500 shadow-flood transition-[left] duration-700 ease-night"
              style={{ left: `calc(${trackPct}% - 5px)`, clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
            />
          </div>
          {stats.pointsToNextTier > 0 && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
              <span className="text-chalk-100">{stats.pointsToNextTier.toLocaleString('en-IN')}</span>{' '}
              points to {stats.nextTier}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 pb-20 pt-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        {/* left rail: redeem + ways to earn */}
        <div className="space-y-6">
          {/* REDEEM — the one living element (slow lime rim loop) */}
          <div className="nm-rim-pulse rounded-[4px] border bg-pitch-700/90 p-6">
            <p className="nm-overline flex items-center gap-2 text-flood-500">
              <Gift className="h-4 w-4" />
              Use your points
            </p>
            <p className="mt-4 font-mono text-4xl tabular-nums tracking-tight text-chalk-100">
              ₹{stats.discountValue.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
              Available discount value
            </p>
            <div className="mt-4 flex items-start gap-2 border-t border-pitchline/60 pt-4">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-flood-500" />
              <p className="text-xs leading-relaxed text-chalk-400">
                Apply your loyalty points for a discount during checkout on your next booking.
              </p>
            </div>
            <Link
              href="/browse"
              className="nm-overline mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[4px] bg-flood-500 px-5 py-3.5 text-pitch-900 transition-[transform,background-color] duration-200 ease-night hover:bg-flood-600 active:translate-y-[2px]"
            >
              Book &amp; redeem
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* ways to earn — dark cards, lime scoreboard values */}
          <div className="overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/80">
            <div className="border-b border-pitchline/60 px-6 py-4">
              <p className="nm-overline text-chalk-400">Ways to earn</p>
            </div>
            {[
              { icon: <Calendar className="h-4 w-4" />, title: 'Book an arena', desc: '10 points per ₹100 spent', pts: '+10/₹100' },
              { icon: <MessageSquare className="h-4 w-4" />, title: 'Leave a review', desc: 'Share your experience', pts: '+50' },
              { icon: <Star className="h-4 w-4" />, title: 'Refer a friend', desc: 'When they complete first booking', pts: '+100' },
            ].map((m) => (
              <div
                key={m.title}
                className="group flex items-center justify-between gap-3 border-b border-pitchline/60 px-6 py-4 transition-colors duration-200 ease-night last:border-0 hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-flood-500">{m.icon}</span>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-chalk-100">
                      {m.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-chalk-400">{m.desc}</p>
                  </div>
                </div>
                <span className="font-mono text-sm tabular-nums text-flood-500">{m.pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* THE LEDGER — tabular alignment is sacred */}
        <div className="overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/80 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-pitchline/60 px-6 py-4">
            <p className="nm-overline text-chalk-400">Points ledger</p>
            {transactions.length > 0 && (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                {transactions.length} entries
              </span>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h3 className="font-display text-2xl uppercase tracking-tight text-chalk-100">
                Empty cabinet
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-chalk-400">
                Book a game to put your first points on the board.
              </p>
            </div>
          ) : (
            <div>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 border-b border-pitchline/60 px-6 py-4 transition-colors duration-200 ease-night last:border-0 hover:bg-white/[0.03]"
                >
                  <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-400">
                    {tx.date}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-chalk-100/90">
                    {tx.description}
                  </span>
                  <span
                    className={`shrink-0 font-mono text-sm tabular-nums ${
                      tx.type === 'earned' ? 'text-flood-500' : 'text-chalk-400'
                    }`}
                  >
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </NightShell>
  );
}

export default function PlayerLoyaltyPage() {
  return (
    <ProtectedRoute requireRole="customer">
      <PlayerLoyaltyContent />
    </ProtectedRoute>
  );
}
