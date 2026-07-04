'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NightShell } from '@/components/night/NightShell';
import { NightLoader } from '@/components/night/NightLoader';
import { CountUp } from '@/components/landing/night-match/CountUp';
import { Reveal } from '@/components/landing/night-match/Reveal';
import { PitchDivider } from '@/components/landing/night-match/PitchDivider';
import {
  Mono, Overline, StatusDot, nightCard, nightPrimaryBtn, nightGhostBtn,
} from '@/components/night/ui';
import { Check, Loader2, Sparkles, Shield, AlertCircle } from 'lucide-react';
import Script from 'next/script';

// Plan types
interface PlanConfig {
  name: string;
  price: number;
  durationMonths: number;
  maxTurfs: number;
  features: string[];
}

// Default plans (used before Settings are fetched)
const DEFAULT_PLANS: Record<string, PlanConfig> = {
  starter: {
    name: 'Starter Plan',
    price: 1500,
    durationMonths: 6,
    maxTurfs: 1,
    features: [
      'List 1 sports facility / arena',
      'Manage booking calendar',
      'Accept online bookings from users',
      'Manual booking entry (walk-in customers)',
      'Basic analytics (Daily bookings, Monthly revenue)',
      'Basic customer management',
      'Email / WhatsApp booking notifications',
      'Standard listing visibility in search',
      'Support via email',
    ],
  },
  pro: {
    name: 'Pro Plan',
    price: 2000,
    durationMonths: 12,
    maxTurfs: 3,
    features: [
      'Everything in Starter Plan',
      'List up to 3 sports fields / arenas',
      'Priority listing in search results',
      'Advanced analytics dashboard',
      'Peak hours analysis & Revenue trends',
      'Booking heatmap',
      'Dynamic pricing tools',
      'Coupon & discount system',
      'Automated booking confirmations',
      'Customer history & repeat user insights',
      'Marketing tools (Featured listing, Banners)',
      'Priority support',
    ],
  },
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionPage() {
  const { user, initialLoading, refreshUserData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [plans, setPlans] = useState<Record<string, PlanConfig>>(DEFAULT_PLANS);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingSubscription, setExistingSubscription] = useState<any>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Redirect if not owner
  useEffect(() => {
    if (!initialLoading && (!user || user.role !== 'owner')) {
      router.push('/');
    }
  }, [user, initialLoading, router]);

  // Fetch existing subscription
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;

      try {
        const subResponse = await fetch(`/api/owner/subscription?uid=${user.uid}`);
        const subData = await subResponse.json();
        if (subData.success) {
          setExistingSubscription(subData.subscription);
          // Load plan config from server if available
          if (subData.subscription.planConfig) {
            // Server might send updated plan configs
          }
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleSelectPlan = async (planKey: 'starter' | 'pro') => {
    if (!user?.uid || !razorpayLoaded) {
      setError('Payment system not ready. Please wait a moment and try again.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Step 1: Create Razorpay order
      const response = await fetch('/api/owner/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUid: user.uid,
          plan: planKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment order');
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: data.key,
        amount: data.amount * 100, // in paise
        currency: data.currency,
        name: 'OutFyld',
        description: `${data.planName} — ${data.durationMonths} Months`,
        order_id: data.orderId,
        handler: async function (response: any) {
          // Step 3: Verify payment
          try {
            const verifyResponse = await fetch('/api/owner/subscription/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                ownerUid: user.uid,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            await refreshUserData();

            // Check if bank details are missing to redirect appropriately
            try {
              const subResponse = await fetch(`/api/owner/subscription?uid=${user.uid}`);
              const subData = await subResponse.json();

              if (subData.success && !subData.subscription.bankDetailsVerified) {
                setSuccess('Subscription activated successfully! Redirecting to add your bank details...');
                setTimeout(() => {
                  router.push('/owner/bank-details');
                }, 2000);
                return;
              }
            } catch (err) {
              console.error('Error fetching latest bank details status:', err);
            }

            setSuccess('Subscription activated successfully! Redirecting to dashboard...');
            setTimeout(() => {
              router.push('/owner/dashboard');
            }, 2000);
          } catch (verifyError: any) {
            setError(verifyError.message || 'Payment verification failed. Please contact support.');
          }
        },
        prefill: data.prefill,
        notes: {
          ownerUid: user.uid,
          plan: planKey,
        },
        theme: {
          color: '#C8F135', // flood-500
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
        setSubmitting(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  if (initialLoading || loading) {
    return (
      <NightShell ambient={0.45}>
        <div className="flex min-h-screen items-center justify-center">
          <NightLoader label="Checking your season pass…" />
        </div>
      </NightShell>
    );
  }

  // Show active subscription status
  if (existingSubscription && existingSubscription.subscriptionStatus === 'active') {
    const endDate = new Date(existingSubscription.subscriptionEndDate);
    const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
      <NightShell ambient={0.45}>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          onLoad={() => setRazorpayLoaded(true)}
        />
        <main className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <button
            onClick={() => router.push('/owner/dashboard')}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
          >
            ← Back to Dashboard
          </button>

          <Reveal>
            <div className="mt-6">
              <p className="nm-overline mb-3 text-flood-500">Season pass</p>
              <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-chalk-100 sm:text-5xl">
                Active subscription
              </h1>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className={`${nightCard} mt-8 overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-pitchline/60 px-6 py-4">
                <Overline>Your subscription details</Overline>
                <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-flood-500">
                  <StatusDot tone="lime" />
                  Active
                </span>
              </div>

              <div className="space-y-5 p-6">
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-chalk-400">Plan</p>
                    <p className="mt-1 font-display text-xl uppercase tracking-tight text-chalk-100">
                      {existingSubscription.subscriptionPlan === 'starter' ? 'Starter' :
                       existingSubscription.subscriptionPlan === 'pro' ? 'Pro' :
                       existingSubscription.subscriptionPlan}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-chalk-400">Amount Paid</p>
                    <p className="mt-1 font-mono text-xl tabular-nums tracking-tight text-chalk-100">
                      ₹<CountUp value={existingSubscription.subscriptionAmount} />
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-chalk-400">Valid Until</p>
                    <p className="mt-1 font-mono text-sm tabular-nums text-chalk-100">
                      {endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-chalk-400">Days Remaining</p>
                    <p className={`mt-1 font-mono text-xl tabular-nums tracking-tight ${daysLeft < 30 ? 'text-red-400' : 'text-flood-500'}`}>
                      <CountUp value={daysLeft} /> <span className="text-xs uppercase tracking-[0.12em]">days</span>
                    </p>
                  </div>
                </div>

                {existingSubscription.subscriptionPlan === 'starter' && (
                  <div className="rounded-[4px] border border-flood-500/40 p-4">
                    <p className="nm-overline flex items-center gap-2 text-flood-500">
                      <Sparkles className="h-4 w-4" />
                      Upgrade to Pro
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-chalk-400">
                      List up to 3 turfs, get priority listing, advanced analytics, and more.
                    </p>
                    <button
                      className={`${nightPrimaryBtn} mt-4`}
                      onClick={() => handleSelectPlan('pro')}
                      disabled={submitting}
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Upgrade to Pro — ₹2,000/year
                    </button>
                  </div>
                )}

                {!existingSubscription.bankDetailsVerified && (
                  <div className="flex items-start gap-3 rounded-[4px] border border-chalk-400/30 p-4">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-chalk-400" />
                    <p className="text-sm leading-relaxed text-chalk-400">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-100">Bank details needed.</span>{' '}
                      Add your bank details to receive booking payments directly.{' '}
                      <button
                        className="font-mono text-[11px] uppercase tracking-[0.12em] text-flood-500 underline underline-offset-4 transition-colors hover:text-flood-600"
                        onClick={() => router.push('/owner/bank-details')}
                      >
                        Add Bank Details →
                      </button>
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-pitchline/60 px-6 py-4">
                <button
                  onClick={() => router.push('/owner/dashboard')}
                  className={`${nightGhostBtn} w-full px-5 py-3 sm:w-auto`}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </Reveal>
        </main>
      </NightShell>
    );
  }

  // Show expired subscription
  if (existingSubscription && existingSubscription.subscriptionStatus === 'expired') {
    return (
      <NightShell ambient={0.45}>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          onLoad={() => setRazorpayLoaded(true)}
        />
        <main className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <button
            onClick={() => router.push('/owner/dashboard')}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
          >
            ← Back to Dashboard
          </button>

          <Reveal>
            <div className="mt-6">
              <p className="nm-overline mb-3 text-flood-500">Season pass</p>
              <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-chalk-100 sm:text-5xl">
                Season expired
              </h1>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className={`${nightCard} mt-8 overflow-hidden border-red-700/50`}>
              <div className="flex items-center justify-between border-b border-pitchline/60 px-6 py-4">
                <Overline>Subscription expired</Overline>
                <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-red-400">
                  <StatusDot tone="red" />
                  Expired
                </span>
              </div>
              <div className="p-6">
                <p className="text-sm text-chalk-400">
                  Your subscription has expired. Renew to keep your arenas visible.
                </p>
                <div className="mt-4 flex items-start gap-3 rounded-[4px] border border-red-700/50 p-4">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                  <p className="text-sm leading-relaxed text-red-400">
                    Your arenas have been hidden from search. Renew your subscription to make them visible again.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Show plan cards for renewal */}
          {renderPlanCards()}
        </main>
      </NightShell>
    );
  }

  // Plan selection view (new subscription)
  function renderPlanCards() {
    return (
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Starter Plan */}
        <Reveal>
          <div className={`${nightCard} flex h-full flex-col p-6 sm:p-8`}>
            <Overline className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-chalk-400" />
              Starter
            </Overline>
            <h3 className="mt-3 font-display text-3xl uppercase tracking-tight text-chalk-100">
              {plans.starter.name}
            </h3>
            <p className="mt-1 text-sm text-chalk-400">Perfect for new turf owners</p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-mono text-4xl tabular-nums tracking-tight text-chalk-100">
                ₹<CountUp value={plans.starter.price} />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                / {plans.starter.durationMonths} months
              </span>
            </div>
            <ul className="mt-6 flex-1 space-y-3 border-t border-pitchline/60 pt-6">
              {plans.starter.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-chalk-400" />
                  <span className="text-sm leading-relaxed text-chalk-400">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              className={`${nightGhostBtn} mt-8 w-full`}
              onClick={() => handleSelectPlan('starter')}
              disabled={submitting || !razorpayLoaded}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Get Starter — ₹1,500
            </button>
          </div>
        </Reveal>

        {/* Pro Plan — the recommended play */}
        <Reveal delay={0.08}>
          <div className="relative flex h-full flex-col rounded-[4px] border border-flood-500/50 bg-pitch-700/90 p-6 shadow-flood transition-[border-color,box-shadow] duration-300 ease-night sm:p-8">
            <span className="absolute -top-3 left-6 border border-flood-500 bg-pitch-900 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-flood-500">
              Recommended
            </span>
            <Overline tone="lime" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Pro
            </Overline>
            <h3 className="mt-3 font-display text-3xl uppercase tracking-tight text-chalk-100">
              {plans.pro.name}
            </h3>
            <p className="mt-1 text-sm text-chalk-400">Maximum bookings &amp; advanced tools</p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-mono text-4xl tabular-nums tracking-tight text-chalk-100">
                ₹<CountUp value={plans.pro.price} />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                / {plans.pro.durationMonths} months
              </span>
            </div>
            <ul className="mt-6 flex-1 space-y-3 border-t border-pitchline/60 pt-6">
              {plans.pro.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-flood-500" />
                  <span className="text-sm leading-relaxed text-chalk-100">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              className={`${nightPrimaryBtn} mt-8 w-full`}
              onClick={() => handleSelectPlan('pro')}
              disabled={submitting || !razorpayLoaded}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Get Pro — ₹2,000
            </button>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <NightShell ambient={0.45}>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <button
          onClick={() => router.push('/owner/dashboard')}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
        >
          ← Back to Dashboard
        </button>

        <Reveal>
          <div className="mt-6 max-w-3xl">
            <p className="nm-overline mb-3 text-flood-500">Season pass</p>
            <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-chalk-100 sm:text-5xl lg:text-6xl">
              Choose your plan
            </h1>
            <p className="mt-4 text-sm text-chalk-400 sm:text-base">
              Select the plan that best fits your business needs.
            </p>
            <div className="mt-5 flex items-start gap-3 rounded-[4px] border border-pitchline bg-pitch-800/60 p-4">
              <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-flood-500" />
              <p className="text-sm leading-relaxed text-chalk-400">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-100">Instant activation.</span>{' '}
                Your account will be activated immediately after payment. No manual approval needed.
              </p>
            </div>
          </div>
        </Reveal>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-[4px] border border-red-700/50 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <p className="text-sm leading-relaxed text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-start gap-3 rounded-[4px] border border-flood-500/40 p-4">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-flood-500" />
            <p className="text-sm leading-relaxed text-flood-500">{success}</p>
          </div>
        )}

        <PitchDivider flag="right" className="mt-2" />

        {renderPlanCards()}

        <p className="mt-10 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
          <Shield className="h-4 w-4 text-flood-500" />
          Secure payment powered by Razorpay. All transactions are encrypted.
        </p>
      </main>
    </NightShell>
  );
}
