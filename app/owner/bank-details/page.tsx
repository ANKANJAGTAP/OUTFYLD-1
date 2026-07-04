'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NightShell } from '@/components/night/NightShell';
import { NightLoader } from '@/components/night/NightLoader';
import { Reveal } from '@/components/landing/night-match/Reveal';
import { PitchDivider } from '@/components/landing/night-match/PitchDivider';
import {
  Mono, Overline, StatusDot, NightInput,
  nightCard, nightPrimaryBtn, nightGhostBtn, nightField,
} from '@/components/night/ui';
import {
  Loader2,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Shield,
  CreditCard,
  Sparkles,
  ArrowRight,
  Lock,
  FileText,
  Eye,
  EyeOff,
  Landmark,
  User,
  Hash,
  Pencil,
  Info,
  LogOut,
} from 'lucide-react';

/* ─── Info Row (for existing details view) ─────────────────────────── */
function DetailRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="group flex items-start gap-4 border-b border-pitchline/60 px-4 py-4 transition-colors duration-200 ease-night last:border-0 hover:bg-white/[0.03] sm:border-0 sm:px-2">
      <span className="mt-0.5 shrink-0 text-flood-500">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-chalk-400">
          {label}
        </p>
        <p
          className={`mt-1 text-[15px] text-chalk-100 ${
            mono ? 'font-mono tabular-nums tracking-tight' : ''
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─── Section Card ──────────────────────────────────────────────── */
function SectionCard({
  icon: Icon,
  title,
  subtitle,
  badge,
  children,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`${nightCard} overflow-hidden`}>
      <div className="flex items-center justify-between border-b border-pitchline/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 text-flood-500" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-100">{title}</p>
            {subtitle && (
              <p className="mt-0.5 font-mono text-[10px] text-chalk-400/70">{subtitle}</p>
            )}
          </div>
        </div>
        {badge}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *  MAIN PAGE
 * ═══════════════════════════════════════════════════════════════════ */
export default function BankDetailsPage() {
  const { user, initialLoading, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingDetails, setExistingDetails] = useState<any>(null);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    accountType: '' as 'savings' | 'current' | '',
    panNumber: '',
    gstNumber: '',
  });

  // Redirect if not owner
  useEffect(() => {
    if (!initialLoading && (!user || user.role !== 'owner')) {
      router.push('/');
    }
  }, [user, initialLoading, router]);

  // Fetch existing bank details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch(`/api/owner/bank-details?uid=${user.uid}`);
        const data = await response.json();
        if (data.success && data.hasBankDetails) {
          setExistingDetails(data.bankDetails);
        }
      } catch (err) {
        console.error('Error fetching bank details:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchDetails();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !formData.accountHolderName ||
      !formData.accountNumber ||
      !formData.ifscCode ||
      !formData.bankName ||
      !formData.accountType ||
      !formData.panNumber
    ) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.accountNumber !== formData.confirmAccountNumber) {
      setError('Account numbers do not match');
      return;
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formData.ifscCode)) {
      setError('Invalid IFSC code format (e.g., SBIN0001234)');
      return;
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.panNumber)) {
      setError('Invalid PAN number format (e.g., ABCDE1234F)');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/owner/bank-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUid: user?.uid,
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode.toUpperCase(),
          bankName: formData.bankName,
          accountType: formData.accountType,
          panNumber: formData.panNumber.toUpperCase(),
          gstNumber: formData.gstNumber || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save bank details');
      }

      setSuccess(data.message || 'Bank details saved successfully!');
      setExistingDetails(data.bankDetails);

      setTimeout(() => {
        router.push('/owner/dashboard');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading ── */
  if (initialLoading || loading) {
    return (
      <NightShell ambient={0.45}>
        <div className="flex min-h-screen items-center justify-center">
          <NightLoader label="Opening the club treasury…" />
        </div>
      </NightShell>
    );
  }

  /* ─── Shared Header + Page Title ───────────────────────────────── */
  const HeroBanner = ({
    badgeIcon: BadgeIcon,
    badgeText,
    heading,
    subtitle,
  }: {
    badgeIcon: any;
    badgeText: string;
    heading: string;
    subtitle: string;
  }) => (
    <>
      {/* ── Top Nav Bar ── */}
      <header className="sticky top-0 z-50 border-b border-pitchline bg-pitch-900/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/owner/dashboard"
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-none text-chalk-100">{user?.name}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">Arena Owner</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-[4px] border border-chalk-400/30 p-2 text-chalk-400 transition-colors duration-200 ease-night hover:border-flood-500 hover:text-flood-500"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Page title — asymmetric, floodlit */}
      <section className="mx-auto max-w-7xl px-4 pb-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <Reveal>
          <p className="nm-overline mb-3 flex items-center gap-2 text-flood-500">
            <BadgeIcon className="h-3.5 w-3.5" />
            {badgeText}
          </p>
          <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-chalk-100 sm:text-5xl lg:text-6xl">
            {heading}
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-chalk-400 sm:text-base">
            {subtitle}
          </p>
        </Reveal>
      </section>

      <PitchDivider flag="right" />
    </>
  );

  /* ══════════════════════════════════════════════════════════════════
   *  EXISTING DETAILS VIEW
   * ══════════════════════════════════════════════════════════════════ */
  if (existingDetails) {
    return (
      <NightShell ambient={0.45}>
        <HeroBanner
          badgeIcon={Landmark}
          badgeText="Club treasury"
          heading="Bank details"
          subtitle="Your linked bank account for receiving booking payments"
        />

        {/* Content */}
        <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Details */}
            <div className="space-y-5 lg:col-span-2">
              <Reveal>
                <SectionCard
                  icon={Building2}
                  title="Account information"
                  subtitle="Your linked bank account details"
                  badge={
                    <span
                      className={`flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] ${
                        existingDetails.bankDetailsVerified ? 'text-flood-500' : 'text-chalk-400'
                      }`}
                    >
                      <StatusDot tone={existingDetails.bankDetailsVerified ? 'lime' : 'chalk'} />
                      {existingDetails.bankDetailsVerified ? 'Verified' : 'Pending'}
                    </span>
                  }
                >
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    <DetailRow
                      icon={<User className="h-4 w-4" />}
                      label="Account Holder"
                      value={existingDetails.accountHolderName}
                    />
                    <DetailRow
                      icon={<Hash className="h-4 w-4" />}
                      label="Account Number"
                      value={existingDetails.accountNumber}
                      mono
                    />
                    <DetailRow
                      icon={<CreditCard className="h-4 w-4" />}
                      label="IFSC Code"
                      value={existingDetails.ifscCode}
                      mono
                    />
                    <DetailRow
                      icon={<Landmark className="h-4 w-4" />}
                      label="Bank"
                      value={existingDetails.bankName}
                    />
                    <DetailRow
                      icon={<Building2 className="h-4 w-4" />}
                      label="Account Type"
                      value={
                        existingDetails.accountType?.charAt(0).toUpperCase() +
                        existingDetails.accountType?.slice(1)
                      }
                    />
                    <DetailRow
                      icon={<FileText className="h-4 w-4" />}
                      label="PAN"
                      value={existingDetails.panNumber}
                      mono
                    />
                  </div>

                  {success && (
                    <div className="mt-4 flex items-start gap-3 rounded-[4px] border border-flood-500/40 p-4">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-flood-500" />
                      <p className="text-sm text-flood-500">{success}</p>
                    </div>
                  )}
                </SectionCard>
              </Reveal>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Quick Actions */}
              <Reveal delay={0.08}>
                <div className={`${nightCard} overflow-hidden`}>
                  <div className="border-b border-pitchline/60 px-6 py-4">
                    <Overline className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-flood-500" />
                      Quick actions
                    </Overline>
                    <p className="mt-1 font-mono text-[10px] text-chalk-400/70">
                      Manage your account
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => setExistingDetails(null)}
                      className="group flex w-full items-center gap-3.5 border-b border-pitchline/60 px-6 py-4 text-left transition-colors duration-200 ease-night hover:bg-white/[0.03]"
                    >
                      <Pencil className="h-4 w-4 shrink-0 text-flood-500" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-100">
                          Update Details
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] text-chalk-400">
                          Change bank account info
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-flood-500 transition-transform duration-200 ease-night group-hover:translate-x-1" />
                    </button>

                    <Link
                      href="/owner/dashboard"
                      className="group flex w-full items-center gap-3.5 px-6 py-4 transition-colors duration-200 ease-night hover:bg-white/[0.03]"
                    >
                      <ArrowLeft className="h-4 w-4 shrink-0 text-chalk-400 transition-colors duration-200 group-hover:text-flood-500" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-100">
                          Dashboard
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] text-chalk-400">
                          Go back to owner dashboard
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-chalk-400 transition-all duration-200 ease-night group-hover:translate-x-1 group-hover:text-flood-500" />
                    </Link>
                  </div>
                </div>
              </Reveal>

              {/* Security Note */}
              <Reveal delay={0.16}>
                <div className="rounded-[4px] border border-flood-500/40 bg-pitch-700/90 p-5">
                  <p className="nm-overline flex items-center gap-2 text-flood-500">
                    <Shield className="h-4 w-4" />
                    Secure &amp; encrypted
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-chalk-400">
                    Your bank details are encrypted and stored securely. We use
                    them only for transferring your booking payments.
                  </p>
                  <p className="mt-4 flex items-center gap-2 border-t border-pitchline/60 pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                    <Lock className="h-3 w-3 text-flood-500" />
                    <Mono>256</Mono>-bit SSL encryption
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </NightShell>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
   *  ADD / UPDATE FORM VIEW
   * ══════════════════════════════════════════════════════════════════ */
  return (
    <NightShell ambient={0.45}>
      <HeroBanner
        badgeIcon={Landmark}
        badgeText="Club treasury"
        heading="Add bank details"
        subtitle="Link your bank account to receive booking payments directly. 90% of each booking goes to your account."
      />

      {/* ─────────── CONTENT ─────────── */}
      <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── LEFT: Form ── */}
          <div className="space-y-5 lg:col-span-2">
            {/* Security Notice */}
            <Reveal>
              <div className="flex items-start gap-3 rounded-[4px] border border-pitchline bg-pitch-800/60 p-4">
                <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-flood-500" />
                <p className="text-sm leading-relaxed text-chalk-400">
                  Your bank details are securely stored and encrypted. They are
                  used only for transferring booking payments to your account.
                </p>
              </div>
            </Reveal>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-[4px] border border-red-700/50 p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-start gap-3 rounded-[4px] border border-flood-500/40 p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-flood-500" />
                <p className="text-sm text-flood-500">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Account Holder */}
              <SectionCard
                icon={User}
                title="Account holder"
                subtitle="Name as per your bank account"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="accountHolderName"
                    className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400"
                  >
                    Full Name <span className="text-red-400">*</span>
                  </Label>
                  <NightInput
                    id="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountHolderName: e.target.value,
                      })
                    }
                    placeholder="Enter name as per bank account"
                    required
                  />
                </div>
              </SectionCard>

              {/* Account Details */}
              <SectionCard
                icon={CreditCard}
                title="Account details"
                subtitle="Your bank account number and confirmation"
              >
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="accountNumber"
                      className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400"
                    >
                      Account Number <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <NightInput
                        id="accountNumber"
                        type={showAccountNumber ? 'text' : 'password'}
                        value={formData.accountNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accountNumber: e.target.value,
                          })
                        }
                        placeholder="Enter account number"
                        required
                        className="pr-11 font-mono tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
                      >
                        {showAccountNumber ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmAccountNumber"
                      className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400"
                    >
                      Confirm Account Number{' '}
                      <span className="text-red-400">*</span>
                    </Label>
                    <NightInput
                      id="confirmAccountNumber"
                      value={formData.confirmAccountNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmAccountNumber: e.target.value,
                        })
                      }
                      placeholder="Re-enter account number"
                      required
                      className={`font-mono tabular-nums ${
                        formData.confirmAccountNumber &&
                        formData.accountNumber !==
                          formData.confirmAccountNumber
                          ? 'border-red-700/60 focus:border-red-500/60'
                          : formData.confirmAccountNumber &&
                            formData.accountNumber ===
                              formData.confirmAccountNumber
                          ? 'border-flood-500/50'
                          : ''
                      }`}
                    />
                    {formData.confirmAccountNumber &&
                      formData.accountNumber ===
                        formData.confirmAccountNumber && (
                        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-flood-500">
                          <CheckCircle2 className="h-3 w-3" />
                          Account numbers match
                        </p>
                      )}
                  </div>
                </div>
              </SectionCard>

              {/* Bank Info */}
              <SectionCard
                icon={Landmark}
                title="Bank information"
                subtitle="IFSC code, bank name, and account type"
              >
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="ifscCode"
                        className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400"
                      >
                        IFSC Code <span className="text-red-400">*</span>
                      </Label>
                      <NightInput
                        id="ifscCode"
                        value={formData.ifscCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ifscCode: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="E.g., SBIN0001234"
                        required
                        maxLength={11}
                        className="font-mono tracking-wide"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="bankName"
                        className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400"
                      >
                        Bank Name <span className="text-red-400">*</span>
                      </Label>
                      <NightInput
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bankName: e.target.value,
                          })
                        }
                        placeholder="E.g., State Bank of India"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="accountType"
                      className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400"
                    >
                      Account Type <span className="text-red-400">*</span>
                    </Label>
                    <Select
                      value={formData.accountType}
                      onValueChange={(value: 'savings' | 'current') =>
                        setFormData({ ...formData, accountType: value })
                      }
                    >
                      <SelectTrigger className={`${nightField} h-auto focus:ring-0 focus:ring-offset-0`}>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[4px]">
                        <SelectItem value="savings">Savings Account</SelectItem>
                        <SelectItem value="current">Current Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SectionCard>

              {/* Tax Info */}
              <SectionCard
                icon={FileText}
                title="Tax information"
                subtitle="PAN and GST details for compliance"
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="panNumber"
                      className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400"
                    >
                      PAN Number <span className="text-red-400">*</span>
                    </Label>
                    <NightInput
                      id="panNumber"
                      value={formData.panNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          panNumber: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="E.g., ABCDE1234F"
                      required
                      maxLength={10}
                      className="font-mono tracking-wide"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="gstNumber"
                      className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400"
                    >
                      GST Number{' '}
                      <span className="normal-case tracking-normal text-chalk-400/60">
                        (Optional)
                      </span>
                    </Label>
                    <NightInput
                      id="gstNumber"
                      value={formData.gstNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gstNumber: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="E.g., 27AAA..."
                      maxLength={15}
                      className="font-mono tracking-wide"
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Submit Buttons */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`${nightPrimaryBtn} flex-1`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Save Bank Details
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/owner/dashboard')}
                  disabled={submitting}
                  className={nightGhostBtn}
                >
                  Skip for Now
                </button>
              </div>
            </form>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-5">
            {/* Payout Info */}
            <Reveal delay={0.08}>
              <div className={`${nightCard} overflow-hidden`}>
                <div className="border-b border-pitchline/60 px-6 py-4">
                  <Overline className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-flood-500" />
                    Payout details
                  </Overline>
                  <p className="mt-1 font-mono text-[10px] text-chalk-400/70">
                    How payments work
                  </p>
                </div>
                <div>
                  {[
                    {
                      label: 'Your Share',
                      value: <><Mono className="text-chalk-100">90%</Mono> of booking</>,
                      icon: CreditCard,
                    },
                    {
                      label: 'Platform Fee',
                      value: <><Mono className="text-chalk-100">10%</Mono> per booking</>,
                      icon: Building2,
                    },
                    {
                      label: 'Payout Cycle',
                      value: 'Weekly settlement',
                      icon: ArrowRight,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3.5 border-b border-pitchline/60 px-6 py-4 last:border-0"
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-flood-500" />
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-400">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-sm text-chalk-100">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Required Fields */}
            <Reveal delay={0.16}>
              <div className={`${nightCard} overflow-hidden`}>
                <div className="border-b border-pitchline/60 px-6 py-4">
                  <Overline className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-flood-500" />
                    Required fields
                  </Overline>
                  <p className="mt-1 font-mono text-[10px] text-chalk-400/70">
                    What you need to provide
                  </p>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {[
                      'Account holder name',
                      'Account number',
                      'IFSC code',
                      'Bank name',
                      'Account type',
                      'PAN number',
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2.5 text-sm text-chalk-100"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-flood-500" />
                        {item}
                      </li>
                    ))}
                    <li className="flex items-center gap-2.5 text-sm text-chalk-400">
                      <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
                        <StatusDot tone="chalk" />
                      </span>
                      GST number (optional)
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Security Card */}
            <Reveal delay={0.24}>
              <div className="rounded-[4px] border border-flood-500/40 bg-pitch-700/90 p-5">
                <p className="nm-overline flex items-center gap-2 text-flood-500">
                  <Shield className="h-4 w-4" />
                  Bank-grade security
                </p>
                <p className="mt-3 text-xs leading-relaxed text-chalk-400">
                  All bank information is encrypted using <Mono className="text-chalk-100">256</Mono>-bit SSL and stored
                  in compliance with RBI guidelines.
                </p>
                <div className="mt-4 flex items-center gap-5 border-t border-pitchline/60 pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-flood-500" />
                    SSL Encrypted
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-flood-500" />
                    RBI Compliant
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </NightShell>
  );
}
