'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightShell } from '@/components/night/NightShell';
import {
  User, Phone, Mail, Shield, ShieldCheck, Copy, Check, ChevronRight,
  CalendarCheck, Trophy, Search, History, LogOut,
} from 'lucide-react';
import Link from 'next/link';

// ─── Copy to Clipboard Hook ─────────────────────────────────────────

function useCopyToClipboard() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return { copiedField, copy };
}

// ─── Ledger info row ─────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  copyable = false,
  href,
  onCopy,
  isCopied = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  copyable?: boolean;
  href?: string;
  onCopy?: () => void;
  isCopied?: boolean;
}) {
  const isEmpty = !value || value === 'Not provided';

  return (
    <div className="group flex items-center justify-between gap-3 border-b border-pitchline/60 px-6 py-4 transition-colors duration-200 ease-night last:border-0 hover:bg-white/[0.03]">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="shrink-0 text-flood-500">{icon}</span>
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-400">{label}</p>
          {isEmpty ? (
            <p className="mt-0.5 font-mono text-sm text-chalk-400/50">Not provided</p>
          ) : href ? (
            <a
              href={href}
              className="mt-0.5 block truncate font-mono text-sm text-chalk-100 transition-colors hover:text-flood-500"
            >
              {value}
            </a>
          ) : (
            <p className="mt-0.5 truncate font-mono text-sm text-chalk-100">{value}</p>
          )}
        </div>
      </div>

      {!isEmpty && copyable && onCopy && (
        <button
          onClick={onCopy}
          className={`shrink-0 rounded-[3px] border p-2 opacity-0 transition-all duration-200 ease-night group-hover:opacity-100 ${
            isCopied
              ? 'border-flood-500/50 text-flood-500'
              : 'border-pitchline text-chalk-400 hover:border-chalk-400/50 hover:text-chalk-100'
          }`}
          title={isCopied ? 'Copied!' : `Copy ${label.toLowerCase()}`}
        >
          {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

// ─── Main — THE PLAYER CARD ──────────────────────────────────────────

function PlayerProfile() {
  const { user, logout } = useAuth();
  const { copiedField, copy } = useCopyToClipboard();

  if (!user) return null;

  const initials = (user.name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <NightShell ambient={0.6}>
      <LandingHeader />

      <div className="mx-auto max-w-4xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <Link
          href="/dashboard/player"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400 transition-colors hover:text-flood-500"
        >
          ← The tunnel
        </Link>

        {/* ── THE PLAYER CARD ── */}
        <div className="relative mt-6 overflow-hidden rounded-[4px] border border-flood-500/30 bg-pitch-700/90 shadow-flood">
          {/* ghost jersey number */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-4 -top-10 font-display text-[11rem] leading-none text-chalk-100/[0.04]"
          >
            {initials}
          </span>
          <div className="flex flex-col items-start gap-6 p-7 sm:flex-row sm:items-center sm:p-9">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[4px] border border-pitchline bg-pitch-800 sm:h-28 sm:w-28">
              <span className="font-display text-5xl uppercase leading-none text-flood-500 sm:text-6xl">
                {initials}
              </span>
            </div>
            <div className="min-w-0">
              <p className="nm-overline flex items-center gap-2 text-flood-500">
                <Shield className="h-3.5 w-3.5" />
                Player account
              </p>
              <h1 className="mt-2 truncate font-display text-4xl uppercase leading-none tracking-tight text-chalk-100 sm:text-5xl">
                {user.name || 'Player'}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-chalk-400">
                {memberSince && (
                  <span className="flex items-center gap-1.5">
                    <CalendarCheck className="h-3 w-3" />
                    Since {memberSince}
                  </span>
                )}
                {user.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── info ledgers ── */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/80">
            <div className="border-b border-pitchline/60 px-6 py-4">
              <p className="nm-overline text-chalk-400">Personal information</p>
            </div>
            <InfoRow icon={<User className="h-4 w-4" />} label="Full name" value={user.name || 'Not provided'} />
            <InfoRow
              icon={<Mail className="h-4 w-4" />}
              label="Email address"
              value={user.email || 'Not provided'}
              copyable
              onCopy={() => user.email && copy(user.email, 'email')}
              isCopied={copiedField === 'email'}
              href={user.email ? `mailto:${user.email}` : undefined}
            />
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="Phone number"
              value={user.phone || 'Not provided'}
              copyable
              onCopy={() => user.phone && copy(user.phone, 'phone')}
              isCopied={copiedField === 'phone'}
              href={user.phone ? `tel:${user.phone}` : undefined}
            />
          </div>

          <div className="overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/80">
            <div className="border-b border-pitchline/60 px-6 py-4">
              <p className="nm-overline text-chalk-400">Account information</p>
            </div>
            <InfoRow icon={<Shield className="h-4 w-4" />} label="Account type" value="Player" />
            <InfoRow
              icon={<CalendarCheck className="h-4 w-4" />}
              label="Member since"
              value={memberSince || 'Not available'}
            />
            <div className="flex items-center gap-3.5 px-6 py-4">
              <ShieldCheck className="h-4 w-4 shrink-0 text-flood-500" />
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-400">
                  Account status
                </p>
                <p className="mt-0.5 flex items-center gap-2 font-mono text-sm text-chalk-100">
                  Active
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-flood-500 shadow-flood" />
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── quick actions — dark rows, lime chevrons ── */}
        <div className="mt-6 overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/80">
          <div className="border-b border-pitchline/60 px-6 py-4">
            <p className="nm-overline text-chalk-400">Quick actions</p>
          </div>
          {[
            { icon: <Search className="h-4 w-4" />, label: 'Browse arenas', desc: 'Find and book turfs near you', href: '/browse' },
            { icon: <History className="h-4 w-4" />, label: 'My bookings', desc: 'The season record', href: '/dashboard/player/bookings' },
            { icon: <Trophy className="h-4 w-4" />, label: 'Rewards', desc: 'The trophy room', href: '/dashboard/player/loyalty' },
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

        {/* ── danger zone — desaturated night red, hairline ── */}
        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-[4px] border border-red-900/50 bg-pitch-700/60 px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-red-300/90">
              Leave the ground
            </p>
            <p className="mt-1 text-xs text-chalk-400">Sign out of your OutFyld account.</p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-[4px] border border-red-900/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-red-300 transition-colors duration-200 ease-night hover:bg-red-950/40 hover:text-red-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </NightShell>
  );
}

export default function PlayerProfilePage() {
  return (
    <ProtectedRoute requireRole="customer">
      <PlayerProfile />
    </ProtectedRoute>
  );
}
