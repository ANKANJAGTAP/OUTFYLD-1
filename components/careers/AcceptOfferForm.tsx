'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  nightField,
  nightPrimaryBtn,
  nightGhostBtn,
  nightCard,
  NightInput,
  NightTextarea,
  Overline,
  Mono,
} from '@/components/night/ui';

interface AcceptOfferFormProps {
  application: any;
  applicationId: string;
}

export default function AcceptOfferForm({ application, applicationId }: AcceptOfferFormProps) {
  const router = useRouter();
  const signatureRef = useRef<SignatureCanvas>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  // Step 1: Verification Data
  const [verificationData, setVerificationData] = useState({
    fullName: application?.fullName || '',
    email: application?.email || '',
    phone: application?.phone || '',
    offerLetterId: '',
    currentAddress: '',
    acceptedPosition: ''
  });
  
  // Step 2: Signature & Agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  
  // Step 3: Payment
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/careers/accept-offer/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          offerLetterId: verificationData.offerLetterId,
          currentAddress: verificationData.currentAddress,
          acceptedPosition: verificationData.acceptedPosition
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureSubmit = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setError('Please provide your digital signature');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Get signature as base64
      const signatureDataUrl = signatureRef.current.toDataURL();
      setSignatureData(signatureDataUrl);

      const response = await fetch('/api/careers/accept-offer/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          signature: signatureDataUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save signature');
      }

      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const handlePayment = async () => {
    setError(null);
    setPaymentProcessing(true);

    try {
      // Create Razorpay order
      const response = await fetch('/api/careers/accept-offer/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          amount: 249
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment order');
      }

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: 'INR',
        name: 'OutFyld',
        description: 'Onboarding Fee + Digital Certificate',
        order_id: data.orderId,
        handler: async function (response: any) {
          // Payment successful
          try {
            const verifyResponse = await fetch('/api/careers/accept-offer/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                applicationId,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              // Redirect to success page
              router.push(`/careers/accept-offer/success/${applicationId}`);
            } else {
              throw new Error(verifyData.error);
            }
          } catch (err: any) {
            setError(err.message);
            setPaymentProcessing(false);
          }
        },
        prefill: {
          name: verificationData.fullName,
          email: verificationData.email,
          contact: verificationData.phone
        },
        theme: {
          color: '#C8F135'
        },
        modal: {
          ondismiss: function() {
            setPaymentProcessing(false);
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      setError(err.message);
      setPaymentProcessing(false);
    }
  };

  const positionTitle = application?.job?.title || 'Intern';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Step ledger */}
      <div className="mb-8 flex items-center gap-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex flex-1 items-center gap-3">
            <span
              className={`font-mono text-sm ${
                n <= currentStep ? 'text-flood-500' : 'text-chalk-400/50'
              }`}
            >
              {String(n).padStart(2, '0')}
            </span>
            <span
              className={`h-px flex-1 transition-colors duration-300 ease-night ${
                n <= currentStep ? 'bg-flood-500/60' : 'bg-pitchline'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 rounded-[4px] border border-red-800/60 bg-red-950/40 px-6 py-4 text-chalk-100">
          <h3 className="nm-overline mb-2 text-red-400">Error occurred</h3>
          <p className="mb-3 text-sm text-chalk-100">{error}</p>
          <div className="space-y-2 rounded-[4px] border border-pitchline bg-pitch-900/60 p-3 text-sm text-chalk-400">
            <p className="text-chalk-100">What to do next:</p>
            <ul className="ml-2 list-inside list-disc space-y-1">
              <li>Check your internet connection and try again</li>
              <li>If payment was deducted, DO NOT pay again — contact us immediately</li>
              <li>Keep your Application ID handy: <Mono className="text-flood-500">{application?._id}</Mono></li>
              <li>Email us at <span className="text-chalk-100">admin@outfyld.in</span> with the error details</li>
            </ul>
          </div>
        </div>
      )}

      {/* Processing Warning */}
      {(loading || paymentProcessing) && (
        <div className="mb-6 rounded-[4px] border border-flood-500/40 bg-pitch-800/80 px-6 py-4 text-chalk-100 shadow-flood">
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 h-6 w-6 flex-shrink-0 animate-spin text-flood-500" />
            <div>
              <h3 className="nm-overline mb-1 text-flood-500">Processing — please wait</h3>
              <p className="mb-2 text-sm font-medium text-chalk-100">Do NOT close this window, press back, or refresh the page.</p>
              <ul className="space-y-1 text-sm text-chalk-400">
                <li>· Payment is being processed…</li>
                <li>· This usually takes 10–30 seconds</li>
                <li>· You will see a confirmation once complete</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Verification */}
      {currentStep === 1 && (
        <div className={`${nightCard} p-8`}>
          <Overline tone="lime">Sign the offer · Step 01</Overline>
          <h2 className="mt-3 font-display text-4xl uppercase leading-[0.95] tracking-tight text-chalk-100">
            Verify your details
          </h2>
          <p className="mt-3 text-sm text-chalk-400">Confirm your information and enter your Offer Letter ID.</p>

          <form onSubmit={handleVerificationSubmit} className="mt-8 space-y-6">
            <div>
              <label className="nm-caption mb-2 block uppercase tracking-[0.14em] text-chalk-400">Full name</label>
              <NightInput type="text" value={verificationData.fullName} disabled />
            </div>

            <div>
              <label className="nm-caption mb-2 block uppercase tracking-[0.14em] text-chalk-400">Email</label>
              <NightInput type="email" value={verificationData.email} disabled />
            </div>

            <div>
              <label className="nm-caption mb-2 block uppercase tracking-[0.14em] text-chalk-400">Phone</label>
              <NightInput type="tel" value={verificationData.phone} disabled />
            </div>

            <div>
              <label className="nm-caption mb-2 block uppercase tracking-[0.14em] text-chalk-400">
                Offer Letter ID <span className="text-flood-500">*</span>
              </label>
              <NightInput
                type="text"
                value={verificationData.offerLetterId}
                onChange={(e) => setVerificationData({ ...verificationData, offerLetterId: e.target.value.trim().toUpperCase() })}
                placeholder="OUTFYLD-INF-2025-XXXXXX"
                required
              />
              <p className="mt-1.5 text-xs text-chalk-400">Enter the Offer Letter ID from your email.</p>
            </div>

            <div>
              <label className="nm-caption mb-2 block uppercase tracking-[0.14em] text-chalk-400">Current address</label>
              <NightTextarea
                value={verificationData.currentAddress}
                onChange={(e) => setVerificationData({ ...verificationData, currentAddress: e.target.value })}
                rows={3}
                placeholder="Enter your current residential address"
              />
            </div>

            <div>
              <label className="nm-caption mb-2 block uppercase tracking-[0.14em] text-chalk-400">
                Confirm position accepted <span className="text-flood-500">*</span>
              </label>
              <select
                value={verificationData.acceptedPosition}
                onChange={(e) => setVerificationData({ ...verificationData, acceptedPosition: e.target.value })}
                required
                className={nightField}
              >
                <option value="">Select the position you&apos;re accepting</option>
                <option value={positionTitle}>{positionTitle}</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className={`${nightPrimaryBtn} w-full`}>
              {loading ? 'Verifying…' : 'Continue to signature'}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Digital Signature */}
      {currentStep === 2 && (
        <div className={`${nightCard} p-8`}>
          <Overline tone="lime">Sign the offer · Step 02</Overline>
          <h2 className="mt-3 font-display text-4xl uppercase leading-[0.95] tracking-tight text-chalk-100">
            Digital signature
          </h2>
          <p className="mt-3 text-sm text-chalk-400">Sign below to accept the offer.</p>

          <div className="mt-8 space-y-6">
            <div>
              <label className="nm-caption mb-2 block uppercase tracking-[0.14em] text-chalk-400">Your signature</label>
              {/* Light backing is intentional — ink needs contrast to read (same exception as QR surfaces). */}
              <div className="overflow-hidden rounded-[4px] border border-pitchline bg-chalk-100">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: 'w-full h-48',
                    style: { touchAction: 'none' }
                  }}
                  backgroundColor="white"
                />
              </div>
              <button
                type="button"
                onClick={clearSignature}
                className="mt-2 nm-caption uppercase tracking-[0.14em] text-red-400 transition-colors hover:text-red-300"
              >
                Clear signature
              </button>
            </div>

            <div className="rounded-[4px] border border-pitchline bg-pitch-800/60 p-4">
              <h3 className="nm-overline mb-2 text-flood-500">Terms &amp; conditions</h3>
              <ul className="space-y-1 text-sm text-chalk-400">
                <li>· I confirm that the information provided is accurate</li>
                <li>· I accept the internship position as offered</li>
                <li>· I understand this is a binding agreement</li>
              </ul>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mr-3 mt-1 h-5 w-5 rounded-[3px] border-pitchline bg-pitch-800 text-flood-500 accent-flood-500 focus:ring-flood-500"
              />
              <label htmlFor="terms" className="text-sm text-chalk-400">
                I have read and agree to the{' '}
                <a
                  href="/careers/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-flood-500 underline transition-colors hover:text-flood-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms &amp; Conditions
                </a>
                {' '}stated above, and I digitally sign this offer acceptance
              </label>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setCurrentStep(1)} className={`${nightGhostBtn} flex-1`}>
                Back
              </button>
              <button type="button" onClick={handleSignatureSubmit} disabled={loading} className={`${nightPrimaryBtn} flex-1`}>
                {loading ? 'Saving…' : 'Submit signature'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {currentStep === 3 && (
        <div className={`${nightCard} p-8`}>
          <Overline tone="lime">Sign the offer · Step 03</Overline>
          <h2 className="mt-3 font-display text-4xl uppercase leading-[0.95] tracking-tight text-chalk-100">
            Complete payment
          </h2>
          <p className="mt-3 text-sm text-chalk-400">Final step to confirm your joining.</p>

          <div className="mt-8 space-y-6">
            <div className="rounded-[4px] border border-flood-500/40 bg-pitch-800/60 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="nm-overline text-chalk-400">Onboarding fee</span>
                <span className="font-mono text-3xl text-flood-500">
                  <span className="text-chalk-400">₹</span>249
                </span>
              </div>
              <div className="space-y-1 text-sm text-chalk-400">
                <p>Processing fee: <Mono className="text-chalk-100">₹149</Mono></p>
                <p>Digital certificate: <Mono className="text-chalk-100">₹100</Mono></p>
              </div>
            </div>

            <div className="rounded-[4px] border border-pitchline bg-pitch-800/40 p-4">
              <p className="text-sm text-chalk-400">
                <span className="text-chalk-100">Note:</span> This is a one-time payment. You will receive a digital joining letter and receipt after successful payment.
              </p>
            </div>

            {/* Critical Payment Instructions */}
            <div className="rounded-[4px] border border-flood-500/40 bg-pitch-800/60 p-4">
              <h4 className="nm-overline mb-3 flex items-center gap-2 text-flood-500">
                <AlertTriangle className="h-4 w-4" />
                Important payment instructions
              </h4>
              <ul className="list-inside list-disc space-y-2 text-sm text-chalk-400">
                <li><span className="text-chalk-100">Do NOT close this window</span> during or after payment</li>
                <li><span className="text-chalk-100">Do NOT press the back button</span> or refresh the page</li>
                <li>Wait patiently for 10–30 seconds after payment</li>
                <li><span className="text-chalk-100">Do NOT pay twice</span> if you see an error — contact us first</li>
                <li>Save your Razorpay transaction ID for reference</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setCurrentStep(2)} disabled={paymentProcessing} className={`${nightGhostBtn} flex-1`}>
                Back
              </button>
              <button type="button" onClick={handlePayment} disabled={paymentProcessing} className={`${nightPrimaryBtn} flex-1`}>
                {paymentProcessing ? (
                  <>
                    <Loader2 className="-ml-1 mr-2 h-5 w-5 animate-spin" />
                    Processing…
                  </>
                ) : (
                  'Pay ₹249 via Razorpay'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
