'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, IndianRupee, Clock, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
      'List 1 sports facility / turf',
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
      'List up to 3 sports fields / turfs',
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
                setSuccess('🎉 Subscription activated successfully! Redirecting to add your bank details...');
                setTimeout(() => {
                  router.push('/owner/bank-details');
                }, 2000);
                return;
              }
            } catch (err) {
              console.error('Error fetching latest bank details status:', err);
            }

            setSuccess('🎉 Subscription activated successfully! Redirecting to dashboard...');
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
          color: '#16a34a', // green-600
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Show active subscription status
  if (existingSubscription && existingSubscription.subscriptionStatus === 'active') {
    const endDate = new Date(existingSubscription.subscriptionEndDate);
    const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-6 md:py-12 px-4">
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          onLoad={() => setRazorpayLoaded(true)}
        />
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <Button onClick={() => router.push('/owner/dashboard')} variant="outline" size="sm">
              ← Back to Dashboard
            </Button>
          </div>
          <Card className="shadow-lg border-green-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl md:text-2xl">Active Subscription</CardTitle>
                <Badge className="bg-green-600 text-white">Active</Badge>
              </div>
              <CardDescription>Your subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Plan</p>
                    <p className="font-semibold text-lg capitalize">
                      {existingSubscription.subscriptionPlan === 'starter' ? 'Starter' :
                       existingSubscription.subscriptionPlan === 'pro' ? 'Pro' :
                       existingSubscription.subscriptionPlan}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount Paid</p>
                    <p className="font-semibold text-lg">₹{existingSubscription.subscriptionAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Valid Until</p>
                    <p className="font-semibold">{endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Days Remaining</p>
                    <p className={`font-semibold ${daysLeft < 30 ? 'text-orange-600' : 'text-green-600'}`}>
                      {daysLeft} days
                    </p>
                  </div>
                </div>
              </div>

              {existingSubscription.subscriptionPlan === 'starter' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <Sparkles className="h-4 w-4 inline mr-1" />
                    <strong>Upgrade to Pro</strong> to list up to 3 turfs, get priority listing, advanced analytics, and more!
                  </p>
                  <Button
                    className="mt-3 bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleSelectPlan('pro')}
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Upgrade to Pro — ₹2,000/year
                  </Button>
                </div>
              )}

              {!existingSubscription.bankDetailsVerified && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Bank details needed!</strong> Add your bank details to receive booking payments directly.{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-yellow-900 underline"
                      onClick={() => router.push('/owner/bank-details')}
                    >
                      Add Bank Details →
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push('/owner/dashboard')} variant="outline" className="w-full sm:w-auto">
                Go to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // Show expired subscription
  if (existingSubscription && existingSubscription.subscriptionStatus === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 py-6 md:py-12 px-4">
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          onLoad={() => setRazorpayLoaded(true)}
        />
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <Button onClick={() => router.push('/owner/dashboard')} variant="outline" size="sm">
              ← Back to Dashboard
            </Button>
          </div>
          <Card className="shadow-lg border-red-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl md:text-2xl">Subscription Expired</CardTitle>
                <Badge variant="destructive">Expired</Badge>
              </div>
              <CardDescription>Your subscription has expired. Renew to keep your turfs visible.</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  Your turfs have been hidden from search. Renew your subscription to make them visible again.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Show plan cards for renewal */}
          {renderPlanCards()}
        </div>
      </div>
    );
  }

  // Plan selection view (new subscription)
  function renderPlanCards() {
    return (
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* Starter Plan */}
        <Card className="relative transition-all hover:shadow-lg hover:border-green-300">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Shield className="h-6 w-6 text-green-600" />
              {plans.starter.name}
            </CardTitle>
            <CardDescription>Perfect for new turf owners</CardDescription>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-4xl font-bold">₹{plans.starter.price.toLocaleString()}</span>
              <span className="text-gray-500">/ {plans.starter.durationMonths} months</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {plans.starter.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              onClick={() => handleSelectPlan('starter')}
              disabled={submitting || !razorpayLoaded}
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Get Starter — ₹1,500
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-2 border-blue-500 transition-all hover:shadow-xl">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-600 text-white px-4 py-1 text-sm">
              <Sparkles className="h-3 w-3 mr-1 inline" />
              Recommended
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              {plans.pro.name}
            </CardTitle>
            <CardDescription>Maximum bookings & advanced tools</CardDescription>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-4xl font-bold">₹{plans.pro.price.toLocaleString()}</span>
              <span className="text-gray-500">/ {plans.pro.durationMonths} months</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {plans.pro.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
              onClick={() => handleSelectPlan('pro')}
              disabled={submitting || !razorpayLoaded}
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Get Pro — ₹2,000
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 md:py-12 px-4">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 md:mb-6">
          <Button onClick={() => router.push('/owner/dashboard')} variant="outline" size="sm">
            ← Back to Dashboard
          </Button>
        </div>

        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
            Choose Your Subscription Plan
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-3 md:mb-4">
            Select the plan that best fits your business needs
          </p>
          <Alert className="max-w-2xl mx-auto bg-blue-50 border-blue-200 text-sm md:text-base">
            <AlertDescription className="text-blue-800">
              💡 <strong>Instant Activation:</strong> Your account will be activated immediately after payment. No manual approval needed!
            </AlertDescription>
          </Alert>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200 max-w-2xl mx-auto">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {renderPlanCards()}

        <div className="text-center mt-8 text-sm text-gray-500">
          <p className="flex items-center justify-center gap-1">
            <Shield className="h-4 w-4" />
            Secure payment powered by Razorpay. All transactions are encrypted.
          </p>
        </div>
      </div>
    </div>
  );
}
