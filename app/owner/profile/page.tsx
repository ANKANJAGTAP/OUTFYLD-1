'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHoverDropdown } from '@/hooks/useHoverDropdown';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  iconBg,
  iconColor,
  label,
  value,
  copyable = false,
  href,
  onCopy,
  isCopied = false,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  copyable?: boolean;
  href?: string;
  onCopy?: () => void;
  isCopied?: boolean;
}) {
  const isEmpty = !value || value === 'Not provided';

  return (
    <div className="group flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all duration-200">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`flex-shrink-0 w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}
        >
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          {isEmpty ? (
            <p className="text-sm text-gray-300 italic mt-0.5">Not provided</p>
          ) : href ? (
            <a
              href={href}
              className="text-[15px] text-gray-900 font-medium hover:text-emerald-600 transition-colors truncate block mt-0.5"
            >
              {value}
            </a>
          ) : (
            <p className="text-[15px] text-gray-900 font-medium truncate mt-0.5">
              {value}
            </p>
          )}
        </div>
      </div>

      {!isEmpty && (copyable || href) && (
        <div className="flex-shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {copyable && onCopy && (
            <button
              onClick={onCopy}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isCopied
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
              }`}
              title={isCopied ? 'Copied!' : `Copy ${label.toLowerCase()}`}
            >
              {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
          {href && !copyable && (
            <a
              href={href}
              className="p-2 rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all duration-200 inline-flex"
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
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  gradient: string;
}) {
  return (
    <Link href={href}>
      <div className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 cursor-pointer h-full">
        <div className="flex items-start justify-between">
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
          >
            {icon}
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-200" />
        </div>
        <h4 className="font-semibold text-gray-900 mt-4 text-sm">{label}</h4>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>
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
    { label: string; color: string; bg: string; border: string; icon: React.ReactNode; description: string }
  > = {
    approved: {
      label: 'Verified',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: <ShieldCheck className="h-4 w-4 text-emerald-600" />,
      description: 'Your account has been verified by our team.',
    },
    pending: {
      label: 'Pending Review',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: <Clock className="h-4 w-4 text-amber-600" />,
      description: 'Your verification is being reviewed. This usually takes 24-48 hours.',
    },
    rejected: {
      label: 'Verification Failed',
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
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
    <div className="min-h-screen bg-[#fafbfc]">

      {/* ─────────── HEADER (same as dashboard) ─────────── */}
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
                    <p className="text-sm font-semibold text-gray-900 leading-none">{user.name}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{user.businessName || 'Turf Owner'}</p>
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
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 sm:pb-32">
          <Link
            href="/owner/dashboard"
            className="text-sm text-white/70 hover:text-white flex items-center gap-1.5 transition-colors duration-200"
          >
            ← Dashboard
          </Link>
          <div className="mt-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Profile</h1>
            <p className="text-emerald-200 mt-1 text-sm">
              Manage your personal and business information
            </p>
          </div>
        </div>
      </div>

      {/* ─────────── PROFILE CARD ─────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">

        {/* Avatar + Name */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-xl shadow-emerald-200">
                {initials}
              </div>
              {user.verificationStatus === 'approved' && (
                <div
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center shadow-lg"
                  title="Verified Account"
                >
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h2 className="text-2xl font-bold text-gray-900 truncate">
                  {user.name || 'Owner'}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color} ${status.border} border`}
                >
                  {status.icon}
                  {status.label}
                </span>
              </div>

              {user.businessName && (
                <p className="text-gray-500 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                  <Building className="h-3.5 w-3.5" />
                  {user.businessName}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-gray-400">
                {memberSince && (
                  <span className="flex items-center gap-1">
                    <CalendarCheck className="h-3 w-3" />
                    Member since {memberSince}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Owner Account
                </span>
              </div>

              {user.verificationStatus !== 'approved' && (
                <div className={`mt-4 flex items-start gap-2 p-3 rounded-xl ${status.bg} ${status.border} border`}>
                  {status.icon}
                  <p className={`text-xs ${status.color} leading-relaxed`}>{status.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─────────── INFO SECTIONS ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">

          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <User className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">Personal Information</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Your contact details</p>
                </div>
              </div>
            </div>
            <div className="p-2">
              <InfoRow
                icon={<User className="h-4 w-4" />}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                label="Full Name"
                value={user.name || 'Not provided'}
              />
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                iconBg="bg-green-50"
                iconColor="text-green-600"
                label="Email Address"
                value={user.email || 'Not provided'}
                copyable
                onCopy={() => copy(user.email, 'email')}
                isCopied={copiedField === 'email'}
                href={user.email ? `mailto:${user.email}` : undefined}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                iconBg="bg-teal-50"
                iconColor="text-teal-600"
                label="Phone Number"
                value={user.phone || 'Not provided'}
                copyable
                onCopy={() => user.phone && copy(user.phone, 'phone')}
                isCopied={copiedField === 'phone'}
                href={user.phone ? `tel:${user.phone}` : undefined}
              />
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <Building className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">Business Information</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Your turf business details</p>
                </div>
              </div>
            </div>
            <div className="p-2">
              <InfoRow
                icon={<Building className="h-4 w-4" />}
                iconBg="bg-green-50"
                iconColor="text-green-600"
                label="Business Name"
                value={user.businessName || 'Not provided'}
              />
              <InfoRow
                icon={<Shield className="h-4 w-4" />}
                iconBg="bg-teal-50"
                iconColor="text-teal-600"
                label="Account Type"
                value={user.role === 'owner' ? 'Turf Owner' : 'Player'}
              />

              {/* Verification status row */}
              <div className="group flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex-shrink-0 w-11 h-11 rounded-xl ${
                      user.verificationStatus === 'approved' ? 'bg-emerald-50' : 'bg-amber-50'
                    } flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}
                  >
                    {user.verificationStatus === 'approved' ? (
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Account Status
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-[15px] font-semibold capitalize ${
                          user.verificationStatus === 'approved' ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {status.label}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          user.verificationStatus === 'approved'
                            ? 'bg-emerald-500'
                            : 'bg-amber-500 animate-pulse'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────── QUICK ACTIONS ─────────── */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction
              icon={<BarChart3 className="h-5 w-5" />}
              label="Dashboard"
              description="View bookings, earnings and analytics"
              href="/owner/dashboard"
              gradient="from-emerald-500 to-green-600"
            />
            <QuickAction
              icon={<CalendarCheck className="h-5 w-5" />}
              label="Manage Bookings"
              description="View and manage all your bookings"
              href="/owner/bookings"
              gradient="from-green-500 to-teal-500"
            />
            <QuickAction
              icon={<Sparkles className="h-5 w-5" />}
              label="My Turfs"
              description="Edit turf details, pricing and slots"
              href="/owner/turfs"
              gradient="from-teal-500 to-cyan-500"
            />
            <QuickAction
              icon={<Settings className="h-5 w-5" />}
              label="Settings"
              description="Account settings and preferences"
              href="/owner/settings"
              gradient="from-gray-600 to-gray-800"
            />
          </div>
        </div>

        {/* ─────────── ACCOUNT SECTION ─────────── */}
        <div className="mt-5 mb-12">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-[15px]">Account</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Manage your account security and preferences
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/owner/settings">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-gray-200 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 h-9 px-4 text-xs font-medium transition-all duration-200"
                  >
                    <Settings className="h-3.5 w-3.5 mr-1.5" />
                    Edit Profile
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 h-9 px-4 text-xs font-medium"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OwnerProfilePage() {
  return (
    <ProtectedRoute requireRole="owner">
      <OwnerProfile />
    </ProtectedRoute>
  );
}