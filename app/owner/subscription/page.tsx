'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Upload, IndianRupee } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';

// Subscription plans configuration
const PLANS = {
  basic: {
    name: 'Basic Plan',
    price: 1000,
    features: [
      'List up to 3 turfs',
      'Basic analytics',
      'Email support',
      'Standard visibility in search',
      'Booking management',
      'Payment tracking'
    ],
    recommended: false
  },
  premium: {
    name: 'Premium Plan',
    price: 2000,
    features: [
      'Unlimited turf listings',
      'Advanced analytics & insights',
      'Priority support (24/7)',
      'Featured listing in search',
      'Advanced booking management',
      'Payment tracking & reports',
      'Social media promotion',
      'Custom branding options'
    ],
    recommended: true
  }
};

export default function SubscriptionPage() {
  const { user, initialLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | null>(null);
  const [adminQR, setAdminQR] = useState<string | null>(null);
  const [paymentImage, setPaymentImage] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingSubscription, setExistingSubscription] = useState<any>(null);

  // Redirect if not owner
  useEffect(() => {
    if (!initialLoading && (!user || user.role !== 'owner')) {
      router.push('/');
    }
  }, [user, initialLoading, router]);

  // Fetch admin QR code and existing subscription
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;

      try {
        // Fetch admin QR code
        const qrResponse = await fetch('/api/admin/settings');
        const qrData = await qrResponse.json();
        if (qrData.success && qrData.settings?.adminPaymentQR) {
          setAdminQR(qrData.settings.adminPaymentQR.url);
        }

        // Fetch existing subscription
        const subResponse = await fetch(`/api/owner/subscription?uid=${user.uid}`);
        const subData = await subResponse.json();
        if (subData.success && subData.subscription.subscriptionPlan) {
          setExistingSubscription(subData.subscription);
          // Don't auto-redirect - let owner choose to view dashboard or stay here
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
  }, [user, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    
    if (!cloudName) {
      throw new Error('Cloudinary configuration missing. Please contact administrator.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'turf_booking'); // You need to create this in Cloudinary
    formData.append('folder', 'payment_screenshots');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to upload image. Please check Cloudinary configuration.');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      public_id: data.public_id
    };
  };

  const handleSubmit = async () => {
    if (!selectedPlan) {
      setError('Please select a subscription plan');
      return;
    }

    if (!paymentImage) {
      setError('Please upload payment screenshot');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Upload payment screenshot to Cloudinary
      setUploading(true);
      const uploadedImage = await uploadToCloudinary(paymentImage);
      setUploading(false);

      // Submit subscription
      const response = await fetch('/api/owner/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUid: user?.uid,
          subscriptionPlan: selectedPlan,
          paymentScreenshot: uploadedImage
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit subscription');
      }

      setSuccess('Subscription submitted successfully! Waiting for admin approval.');
      setTimeout(() => {
        router.push('/owner/dashboard');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show pending status if already submitted
  if (existingSubscription && existingSubscription.verificationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 md:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <Button onClick={() => router.push('/owner/dashboard')} variant="outline" size="sm">
              ← Back to Dashboard
            </Button>
          </div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Subscription Pending Approval</CardTitle>
              <CardDescription className="text-sm md:text-base">Your subscription is awaiting admin verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
                <p className="text-center text-sm md:text-base text-muted-foreground mb-4">
                Your subscription payment is under review. You&apos;ll be able to add turfs once the admin approves your payment.
              </p>
              </div>
              <div className="space-y-2 text-sm md:text-base">
                <p><strong>Plan:</strong> {existingSubscription.subscriptionPlan === 'basic' ? 'Basic' : 'Premium'}</p>
                <p><strong>Amount:</strong> ₹{existingSubscription.subscriptionAmount}/month</p>
              </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back to Dashboard Button */}
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
              💡 <strong>Note:</strong> You need an active subscription plan to add and manage turfs on the platform.
            </AlertDescription>
          </Alert>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Plan Selection */}
        {!selectedPlan && (
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {Object.entries(PLANS).map(([key, plan]) => (
              <Card 
                key={key}
                className={`relative cursor-pointer transition-all hover:shadow-lg ${
                  plan.recommended ? 'border-2 border-blue-500' : ''
                }`}
                onClick={() => setSelectedPlan(key as 'basic' | 'premium')}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      Recommended
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-2 mt-4">
                    <IndianRupee className="h-6 w-6 text-gray-600" />
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" size="lg">
                    Select {plan.name}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Payment Upload */}
        {selectedPlan && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Complete Payment</CardTitle>
              <CardDescription>
                You selected: <strong>{PLANS[selectedPlan].name}</strong> - ₹{PLANS[selectedPlan].price}/month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Admin QR Code */}
              {adminQR ? (
                <div className="text-center space-y-4">
                  <Label className="text-lg font-semibold">Scan QR Code to Pay</Label>
                  <div className="flex justify-center">
                    <div className="relative w-64 h-64 border-2 border-gray-200 rounded-lg overflow-hidden">
                      <Image
                        src={adminQR}
                        alt="Payment QR Code"
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pay ₹{PLANS[selectedPlan].price} using any UPI app
                  </p>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Payment QR code not available. Please contact admin.
                  </AlertDescription>
                </Alert>
              )}

              {/* Payment Screenshot Upload */}
              <div className="space-y-4">
                <Label htmlFor="payment-screenshot" className="text-lg font-semibold">
                  Upload Payment Screenshot
                </Label>
                <Input
                  id="payment-screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                {paymentPreview && (
                  <div className="relative w-full h-64 border-2 border-gray-200 rounded-lg overflow-hidden">
                    <Image
                      src={paymentPreview}
                      alt="Payment Screenshot"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedPlan(null)}
                disabled={submitting}
              >
                Change Plan
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || !paymentImage || !adminQR}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploading ? 'Uploading...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit for Approval
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
