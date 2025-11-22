'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';

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
          color: '#16a34a'
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Error Display */}
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-900 px-6 py-4 rounded-lg mb-6">
          <h3 className="font-bold text-lg mb-2">❌ Error Occurred</h3>
          <p className="mb-3">{error}</p>
          <div className="text-sm bg-white border border-red-200 rounded p-3 space-y-2">
            <p className="font-semibold">What to do next:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Check your internet connection and try again</li>
              <li>If payment was deducted, DO NOT pay again - Contact us immediately</li>
              <li>Keep your Application ID handy: <strong>{application?._id}</strong></li>
              <li>Email us at <strong>admin@outfyld.in</strong> with the error details</li>
            </ul>
          </div>
        </div>
      )}

      {/* Processing Warning */}
      {(loading || paymentProcessing) && (
        <div className="bg-yellow-50 border-2 border-yellow-400 text-yellow-900 px-6 py-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <svg className="animate-spin h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <h3 className="font-bold text-lg mb-1">⚠️ Processing - Please Wait!</h3>
              <p className="font-semibold mb-2">DO NOT close this window, press back, or refresh the page!</p>
              <ul className="text-sm space-y-1">
                <li>• Payment is being processed...</li>
                <li>• This usually takes 10-30 seconds</li>
                <li>• You will see a confirmation once complete</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Verification */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Step 1: Verify Your Details</h2>
          <p className="text-gray-600 mb-6">Please confirm your information and enter your Offer Letter ID</p>

          <form onSubmit={handleVerificationSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={verificationData.fullName}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={verificationData.email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={verificationData.phone}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offer Letter ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={verificationData.offerLetterId}
                onChange={(e) => setVerificationData({ ...verificationData, offerLetterId: e.target.value.toUpperCase() })}
                placeholder="OUTFYLD-INF-2025-XXXXXX"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">Enter the Offer Letter ID from your email</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Address</label>
              <textarea
                value={verificationData.currentAddress}
                onChange={(e) => setVerificationData({ ...verificationData, currentAddress: e.target.value })}
                rows={3}
                placeholder="Enter your current residential address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Position Accepted <span className="text-red-500">*</span>
              </label>
              <select
                value={verificationData.acceptedPosition}
                onChange={(e) => setVerificationData({ ...verificationData, acceptedPosition: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select the position you're accepting</option>
                <option value={application?.job?.title || 'Intern'}>{application?.job?.title || 'Intern'}</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Continue to Signature →'}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Digital Signature */}
      {currentStep === 2 && (
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Step 2: Digital Signature</h2>
          <p className="text-gray-600 mb-6">Please sign below to accept the offer</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Signature</label>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
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
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Clear Signature
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Terms & Conditions</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• I confirm that the information provided is accurate</li>
                <li>• I accept the internship position as offered</li>
                <li>• I understand this is a binding agreement</li>
              </ul>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 mr-3 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                I have read and agree to the{' '}
                <a
                  href="/careers/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800 underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms & Conditions
                </a>
                {' '}stated above, and I digitally sign this offer acceptance
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSignatureSubmit}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Submit Signature →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {currentStep === 3 && (
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Step 3: Complete Payment</h2>
          <p className="text-gray-600 mb-6">Final step to confirm your joining</p>

          <div className="space-y-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-800">Onboarding Fee</span>
                <span className="text-3xl font-bold text-green-600">₹249</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>✓ Processing Fee: ₹149</p>
                <p>✓ Digital Certificate: ₹100</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This is a one-time payment. You will receive a digital joining letter and receipt after successful payment.
              </p>
            </div>

            {/* Critical Payment Instructions */}
            <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">🔐 Important Payment Instructions:</h4>
              <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                <li><strong>Do NOT close this window</strong> during or after payment</li>
                <li><strong>Do NOT press the back button</strong> or refresh the page</li>
                <li>Wait patiently for 10-30 seconds after payment</li>
                <li><strong>Do NOT pay twice</strong> if you see an error - contact us first</li>
                <li>Save your Razorpay transaction ID for reference</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={paymentProcessing}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handlePayment}
                disabled={paymentProcessing}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {paymentProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  '💳 Pay ₹249 via Razorpay'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
