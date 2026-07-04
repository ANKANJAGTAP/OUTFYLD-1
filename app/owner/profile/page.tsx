'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHoverDropdown } from '@/hooks/useHoverDropdown';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { NightShell } from '@/components/night/NightShell';
import { Reveal } from '@/components/landing/night-match/Reveal';
import { PitchDivider } from '@/components/landing/night-match/PitchDivider';
import {
  Overline, StatusDot, nightCard, nightCardHover, nightGhostBtn,
} from '@/components/night/ui';
import {
  User, Phone, Mail, Building,
  Shield, ShieldCheck, Clock, Copy, Check,
  ExternalLink, ChevronRight, ChevronDown, Sparkles,
  BarChart3, CalendarCheck, Settings, LogOut,
  AlertCircle, CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

// ─── Profile Info Row ────────────────────────────────────────────────
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
      <div className="flex min-w-0 items-center gap-4">
        <span className="shrink-0 text-flood-500">{icon}</span>
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-chalk-400">
            {label}
          </p>
          {isEmpty ? (
            <p className="mt-0.5 text-sm italic text-chalk-400/50">Not provided</p>
          ) : href ? (
            <a
              href={href}
              className="mt-0.5 block truncate text-[15px] text-chalk-100 transition-colors duration-200 ease-night hover:text-flood-500"
            >
              {value}
            </a>
          ) : (
            <p className="mt-0.5 truncate text-[15px] text-chalk-100">
              {value}
            </p>
          )}
        </div>
      </div>

      {!isEmpty && (copyable || href) && (
        <div className="ml-3 flex-shrink-0 opacity-0 transition-opacity duration-200 ease-night group-hover:opacity-100">
          {copyable && onCopy && (
            <button
              onClick={onCopy}
              className={`rounded-[4px] border p-2 transition-colors duration-200 ease-night ${
                isCopied
                  ? 'border-flood-500/60 text-flood-500'
                  : 'border-pitchline text-chalk-400 hover:border-chalk-400/40 hover:text-chalk-100'
              }`}
              title={isCopied ? 'Copied!' : `Copy ${label.toLowerCase()}`}
            >
              {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
          {href && !copyable && (
            <a
              href={href}
              className="inline-flex rounded-[4px] border border-pitchline p-2 text-chalk-400 transition-colors duration-200 ease-night hover:border-chalk-400/40 hover:text-chalk-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Quick Action Card ───────────────────────────────────────────────
function QuickAction({
  icon,
  label,
  description,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className={`${nightCard} ${nightCardHover} group h-full cursor-pointer p-5`}>
        <div className="flex items-start justify-between">
          <span className="text-flood-500">{icon}</span>
          <ChevronRight className="h-4 w-4 text-chalk-400 transition-all duration-200 ease-night group-hover:translate-x-1 group-hover:text-flood-500" />
        </div>
        <h4 className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-100">{label}</h4>
        <p className="mt-1 font-mono text-[10px] leading-relaxed text-chalk-400">{description}</p>
      </div>
    </Link>
  );
}

// ─── Main Profile Component ──────────────────────────────────────────
function OwnerProfile() {
  const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown();
  const { user, logout } = useAuth();
  const { copiedField, copy } = useCopyToClipboard();
  const router = useRouter();

  if (!user) return null;

  const verificationConfig: Record<
    string,
    { label: string; tone: 'lime' | 'chalk' | 'red'; text: string; border: string; icon: React.ReactNode; description: string }
  > = {
    approved: {
      label: 'Verified',
      tone: 'lime',
      text: 'text-flood-500',
      border: 'border-flood-500/40',
      icon: <ShieldCheck className="h-4 w-4 text-flood-500" />,
      description: 'Your account has been verified by our team.',
    },
    pending: {
      label: 'Pending Review',
      tone: 'chalk',
      text: 'text-chalk-400',
      border: 'border-chalk-400/30',
      icon: <Clock className="h-4 w-4 text-chalk-400" />,
      description: 'Your verification is being reviewed. This usually takes 24-48 hours.',
    },
    rejected: {
      label: 'Verification Failed',
      tone: 'red',
      text: 'text-red-400',
      border: 'border-red-700/50',
      icon: <AlertCircle className="h-4 w-4 text-red-400" />,
      description: 'Your verification was not approved. Please contact support.',
    },
  };

  const status = verificationConfig[user.verificationStatus || 'pending'] || verificationConfig.pending;

  const initials = (user.name || 'O')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <NightShell ambient={0.45}>

      {/* ─────────── HEADER (same as dashboard) ─────────── */}
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
                <DropdownMenuItem onClick={() => router.push('/owner/analytics')} className="cursor-pointer rounded-[4px] px-3 py-2.5 transition-colors focus:bg-white/[0.06] focus:text-flood-500">
                  <BarChart3 className="mr-3 h-5 w-5" />
                  <span className="text-base">Analytics</span>
                </DropdownMenuItem>
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
      <section className="mx-auto max-w-4xl px-4 pb-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <Reveal>
          <Link
            href="/owner/dashboard"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
          >
            ← Dashboard
          </Link>
          <div className="mt-5">
            <p className="nm-overline mb-3 text-flood-500">The manager&apos;s office</p>
            <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-chalk-100 sm:text-5xl lg:text-6xl">
              Manager profile
            </h1>
            <p className="mt-4 text-sm text-chalk-400">
              Manage your personal and business information
            </p>
          </div>
        </Reveal>
      </section>

      <PitchDivider flag="right" />

      {/* ─────────── PROFILE CARD ─────────── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        {/* Avatar + Name */}
        <Reveal>
          <div className={`${nightCard} p-6 sm:p-8`}>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="relative flex-shrink-0">
                <div className="flex h-24 w-24 items-center justify-center rounded-[4px] border border-pitchline bg-pitch-800 font-display text-3xl text-flood-500 sm:h-28 sm:w-28 sm:text-4xl">
                  {initials}
                </div>
                {user.verificationStatus === 'approved' && (
                  <div
                    className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-[4px] bg-flood-500 shadow-flood"
                    title="Verified Account"
                  >
                    <Check className="h-3.5 w-3.5 text-pitch-900" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <h2 className="truncate font-display text-2xl uppercase tracking-tight text-chalk-100 sm:text-3xl">
                    {user.name || 'Owner'}
                  </h2>
                  <span className="inline-flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400 sm:justify-start">
                    <StatusDot tone={status.tone} />
                    {status.label}
                  </span>
                </div>

                {user.businessName && (
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-chalk-400 sm:justify-start">
                    <Building className="h-3.5 w-3.5" />
                    {user.businessName}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-center gap-4 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400 sm:justify-start">
                  {memberSince && (
                    <span className="flex items-center gap-1.5">
                      <CalendarCheck className="h-3 w-3" />
                      Member since {memberSince}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3 w-3" />
                    Owner Account
                  </span>
                </div>

                {user.verificationStatus !== 'approved' && (
                  <div className={`mt-4 flex items-start gap-2 rounded-[4px] border ${status.border} p-3`}>
                    {status.icon}
                    <p className={`text-xs leading-relaxed ${status.text}`}>{status.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ─────────── INFO SECTIONS ─────────── */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* Personal Information */}
          <Reveal>
            <div className={`${nightCard} overflow-hidden`}>
              <div className="border-b border-pitchline/60 px-6 py-4">
                <Overline className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-flood-500" />
                  Personal information
                </Overline>
                <p className="mt-1 font-mono text-[10px] text-chalk-400/60">Your contact details</p>
              </div>
              <div>
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Full Name"
                  value={user.name || 'Not provided'}
                />
                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Email Address"
                  value={user.email || 'Not provided'}
                  copyable
                  onCopy={() => copy(user.email, 'email')}
                  isCopied={copiedField === 'email'}
                  href={user.email ? `mailto:${user.email}` : undefined}
                />
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone Number"
                  value={user.phone || 'Not provided'}
                  copyable
                  onCopy={() => user.phone && copy(user.phone, 'phone')}
                  isCopied={copiedField === 'phone'}
                  href={user.phone ? `tel:${user.phone}` : undefined}
                />
              </div>
            </div>
          </Reveal>

          {/* Business Information */}
          <Reveal delay={0.08}>
            <div className={`${nightCard} overflow-hidden`}>
              <div className="border-b border-pitchline/60 px-6 py-4">
                <Overline className="flex items-center gap-2">
                  <Building className="h-3.5 w-3.5 text-flood-500" />
                  Business information
                </Overline>
                <p className="mt-1 font-mono text-[10px] text-chalk-400/60">Your turf business details</p>
              </div>
              <div>
                <InfoRow
                  icon={<Building className="h-4 w-4" />}
                  label="Business Name"
                  value={user.businessName || 'Not provided'}
                />
                <InfoRow
                  icon={<Shield className="h-4 w-4" />}
                  label="Account Type"
                  value={user.role === 'owner' ? 'Arena Owner' : 'Player'}
                />

                {/* Verification status row */}
                <div className="group flex items-center justify-between px-6 py-4 transition-colors duration-200 ease-night hover:bg-white/[0.03]">
                  <div className="flex items-center gap-4">
                    <span className="shrink-0 text-flood-500">
                      {user.verificationStatus === 'approved' ? (
                        <ShieldCheck className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </span>
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-chalk-400">
                        Account Status
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`font-mono text-[11px] uppercase tracking-[0.14em] ${status.text}`}>
                          {status.label}
                        </span>
                        <StatusDot tone={status.tone} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ─────────── QUICK ACTIONS ─────────── */}
        <div className="mt-8">
          <Overline className="mb-3 px-1">Quick actions</Overline>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              icon={<BarChart3 className="h-5 w-5" />}
              label="Dashboard"
              description="View bookings, earnings and analytics"
              href="/owner/dashboard"
            />
            <QuickAction
              icon={<CalendarCheck className="h-5 w-5" />}
              label="Manage Bookings"
              description="View and manage all your bookings"
              href="/owner/bookings"
            />
            <QuickAction
              icon={<Sparkles className="h-5 w-5" />}
              label="My Arenas"
              description="Edit turf details, pricing and slots"
              href="/owner/turfs"
            />
            <QuickAction
              icon={<Settings className="h-5 w-5" />}
              label="Settings"
              description="Account settings and preferences"
              href="/owner/settings"
            />
          </div>
        </div>

        {/* ─────────── ACCOUNT SECTION ─────────── */}
        <div className="mb-16 mt-5">
          <div className={`${nightCard} p-6`}>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <Overline>Account</Overline>
                <p className="mt-1 font-mono text-[10px] text-chalk-400/60">
                  Manage your account security and preferences
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/owner/settings" className={`${nightGhostBtn} px-4 py-2.5`}>
                  <Settings className="h-3.5 w-3.5" />
                  Edit Profile
                </Link>
                <button
                  onClick={logout}
                  className="nm-overline inline-flex items-center gap-2 rounded-[4px] border border-red-700/50 px-4 py-2.5 text-red-400 transition-colors duration-200 ease-night hover:border-red-500 hover:text-red-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NightShell>
  );
}

export default function OwnerProfilePage() {
  return (
    <ProtectedRoute requireRole="owner">
      <OwnerProfile />
    </ProtectedRoute>
  );
}
