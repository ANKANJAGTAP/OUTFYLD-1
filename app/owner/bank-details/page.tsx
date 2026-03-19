'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Copy,
  Pencil,
  Info,
  LogOut,
  Building,
} from 'lucide-react';

/* ─── Info Row (for existing details view) ─────────────────────────── */
function DetailRow({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200">
      <div
        className={`flex-shrink-0 w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}
      >
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <p
          className={`text-[15px] text-gray-900 font-medium mt-0.5 ${
            mono ? 'font-mono' : ''
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
  iconBg,
  iconColor,
  title,
  subtitle,
  badge,
  children,
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}
          >
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-[15px]">{title}</h3>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
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
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Loading bank details…
          </p>
        </div>
      </div>
    );
  }

  /* ─── Shared Hero Banner Component ─────────────────────────────── */
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
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-28">
        {/* ── Top Nav Bar (same as Arena Owner Dashboard) ── */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/owner/dashboard">
            <Button
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl -ml-2 font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-[11px] text-emerald-200">Arena Owner</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="text-center">
          <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 text-[10px] mb-4">
            <BadgeIcon className="h-3 w-3 mr-1" />
            {badgeText}
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            {heading}
          </h1>
          <p className="text-emerald-200 text-base sm:text-lg mt-4 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
   *  EXISTING DETAILS VIEW
   * ══════════════════════════════════════════════════════════════════ */
  if (existingDetails) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <HeroBanner
          badgeIcon={Landmark}
          badgeText="Bank Account"
          heading="Bank Details"
          subtitle="Your linked bank account for receiving booking payments"
        />

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-5">
              <SectionCard
                icon={Building2}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                title="Account Information"
                subtitle="Your linked bank account details"
                badge={
                  <Badge
                    className={`${
                      existingDetails.bankDetailsVerified
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    } flex gap-1.5 items-center py-1 px-3 rounded-lg`}
                  >
                    {existingDetails.bankDetailsVerified ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span className="uppercase tracking-wider font-semibold text-[10px]">
                      {existingDetails.bankDetailsVerified
                        ? 'Verified'
                        : 'Pending'}
                    </span>
                  </Badge>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <DetailRow
                    icon={<User className="h-4 w-4" />}
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-600"
                    label="Account Holder"
                    value={existingDetails.accountHolderName}
                  />
                  <DetailRow
                    icon={<Hash className="h-4 w-4" />}
                    iconBg="bg-green-50"
                    iconColor="text-green-600"
                    label="Account Number"
                    value={existingDetails.accountNumber}
                    mono
                  />
                  <DetailRow
                    icon={<CreditCard className="h-4 w-4" />}
                    iconBg="bg-teal-50"
                    iconColor="text-teal-600"
                    label="IFSC Code"
                    value={existingDetails.ifscCode}
                    mono
                  />
                  <DetailRow
                    icon={<Landmark className="h-4 w-4" />}
                    iconBg="bg-cyan-50"
                    iconColor="text-cyan-600"
                    label="Bank"
                    value={existingDetails.bankName}
                  />
                  <DetailRow
                    icon={<Building2 className="h-4 w-4" />}
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-600"
                    label="Account Type"
                    value={
                      existingDetails.accountType?.charAt(0).toUpperCase() +
                      existingDetails.accountType?.slice(1)
                    }
                  />
                  <DetailRow
                    icon={<FileText className="h-4 w-4" />}
                    iconBg="bg-green-50"
                    iconColor="text-green-600"
                    label="PAN"
                    value={existingDetails.panNumber}
                    mono
                  />
                </div>

                {success && (
                  <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-4">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-emerald-700">{success}</p>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-[15px]">
                        Quick Actions
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Manage your account
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <button
                    onClick={() => setExistingDetails(null)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group w-full text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                      <Pencil className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-800">
                        Update Details
                      </p>
                      <p className="text-[11px] text-emerald-600">
                        Change bank account info
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <Link
                    href="/owner/dashboard"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group w-full"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <ArrowLeft className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">
                        Dashboard
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Go back to owner dashboard
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </Link>
                </div>
              </div>

              {/* Security Note */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '16px 16px',
                  }}
                />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-emerald-200" />
                    <span className="text-sm font-semibold">
                      Secure & Encrypted
                    </span>
                  </div>
                  <p className="text-emerald-100 text-xs leading-relaxed mb-4">
                    Your bank details are encrypted and stored securely. We use
                    them only for transferring your booking payments.
                  </p>
                  <div className="flex items-center gap-2 text-emerald-200 text-[11px]">
                    <Lock className="h-3 w-3" />
                    <span>256-bit SSL encryption</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
   *  ADD / UPDATE FORM VIEW
   * ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <HeroBanner
        badgeIcon={Landmark}
        badgeText="Payout Setup"
        heading="Add Bank Details"
        subtitle="Link your bank account to receive booking payments directly. 90% of each booking goes to your account."
      />

      {/* ─────────── CONTENT ─────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Form ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Security Notice */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                Your bank details are securely stored and encrypted. They are
                used only for transferring booking payments to your account.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-emerald-700">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Account Holder */}
              <SectionCard
                icon={User}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                title="Account Holder"
                subtitle="Name as per your bank account"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="accountHolderName"
                    className="text-xs font-semibold text-gray-700"
                  >
                    Full Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
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
                    className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </div>
              </SectionCard>

              {/* Account Details */}
              <SectionCard
                icon={CreditCard}
                iconBg="bg-green-50"
                iconColor="text-green-600"
                title="Account Details"
                subtitle="Your bank account number and confirmation"
              >
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="accountNumber"
                      className="text-xs font-semibold text-gray-700"
                    >
                      Account Number <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Input
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
                        className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
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
                      className="text-xs font-semibold text-gray-700"
                    >
                      Confirm Account Number{' '}
                      <span className="text-red-400">*</span>
                    </Label>
                    <Input
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
                      className={`rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all ${
                        formData.confirmAccountNumber &&
                        formData.accountNumber !==
                          formData.confirmAccountNumber
                          ? 'border-red-300 focus:border-red-300 focus:ring-red-100'
                          : formData.confirmAccountNumber &&
                            formData.accountNumber ===
                              formData.confirmAccountNumber
                          ? 'border-emerald-300'
                          : ''
                      }`}
                    />
                    {formData.confirmAccountNumber &&
                      formData.accountNumber ===
                        formData.confirmAccountNumber && (
                        <p className="text-[11px] text-emerald-500 flex items-center gap-1">
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
                iconBg="bg-teal-50"
                iconColor="text-teal-600"
                title="Bank Information"
                subtitle="IFSC code, bank name, and account type"
              >
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="ifscCode"
                        className="text-xs font-semibold text-gray-700"
                      >
                        IFSC Code <span className="text-red-400">*</span>
                      </Label>
                      <Input
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
                        className="rounded-xl border-gray-200 h-11 text-sm font-mono focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="bankName"
                        className="text-xs font-semibold text-gray-700"
                      >
                        Bank Name <span className="text-red-400">*</span>
                      </Label>
                      <Input
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
                        className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="accountType"
                      className="text-xs font-semibold text-gray-700"
                    >
                      Account Type <span className="text-red-400">*</span>
                    </Label>
                    <Select
                      value={formData.accountType}
                      onValueChange={(value: 'savings' | 'current') =>
                        setFormData({ ...formData, accountType: value })
                      }
                    >
                      <SelectTrigger className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
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
                iconBg="bg-cyan-50"
                iconColor="text-cyan-600"
                title="Tax Information"
                subtitle="PAN and GST details for compliance"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="panNumber"
                      className="text-xs font-semibold text-gray-700"
                    >
                      PAN Number <span className="text-red-400">*</span>
                    </Label>
                    <Input
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
                      className="rounded-xl border-gray-200 h-11 text-sm font-mono focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="gstNumber"
                      className="text-xs font-semibold text-gray-700"
                    >
                      GST Number{' '}
                      <span className="text-gray-400 font-normal">
                        (Optional)
                      </span>
                    </Label>
                    <Input
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
                      className="rounded-xl border-gray-200 h-11 text-sm font-mono focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 disabled:opacity-50 disabled:shadow-none transition-all duration-200"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Save Bank Details
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/owner/dashboard')}
                  disabled={submitting}
                  className="rounded-xl h-11 border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-all"
                >
                  Skip for Now
                </Button>
              </div>
            </form>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-5">
            {/* Payout Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px]">
                      Payout Details
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      How payments work
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {[
                  {
                    label: 'Your Share',
                    value: '90% of booking',
                    icon: CreditCard,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                  },
                  {
                    label: 'Platform Fee',
                    value: '10% per booking',
                    icon: Building2,
                    color: 'text-teal-600',
                    bg: 'bg-teal-50',
                  },
                  {
                    label: 'Payout Cycle',
                    value: 'Weekly settlement',
                    icon: ArrowRight,
                    color: 'text-cyan-600',
                    bg: 'bg-cyan-50',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}
                    >
                      <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                        {item.label}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Fields */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Info className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px]">
                      Required Fields
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      What you need to provide
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <ul className="space-y-2.5">
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
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      </div>
                      {item}
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-gray-400">○</span>
                    </div>
                    GST number (optional)
                  </li>
                </ul>
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '16px 16px',
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-emerald-200" />
                  <span className="text-sm font-semibold">
                    Bank-Grade Security
                  </span>
                </div>
                <p className="text-emerald-100 text-xs leading-relaxed mb-3">
                  All bank information is encrypted using 256-bit SSL and stored
                  in compliance with RBI guidelines.
                </p>
                <div className="flex items-center gap-4 text-emerald-200 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    SSL Encrypted
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    RBI Compliant
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}