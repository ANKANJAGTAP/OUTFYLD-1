'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle, XCircle, Shield, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import Script from 'next/script';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  turf: {
    _id: string;
    ownerId: string;
    businessName: string;
    pricing: number;
    upiQrCode?: {
      url: string;
      public_id: string;
    };
  };
  selectedSlots: Array<{
    day: string;
    date: Date;
    startTime: string;
    endTime: string;
  }>;
  totalAmount: number;
  onSuccess: () => void;
  paymentTimer?: number;
}

export default function PaymentModal({
  isOpen,
  onClose,
  turf,
  selectedSlots,
  totalAmount,
  onSuccess,
  paymentTimer = 0
}: PaymentModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'ready' | 'processing' | 'success' | 'error'>('ready');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [razorpayOpen, setRazorpayOpen] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);

  // Check if Razorpay is already loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      setRazorpayLoaded(true);
    }
  }, []);

  // Fetch loyalty points when modal opens
  useEffect(() => {
    if (isOpen && user?.role === 'customer') {
      const fetchLoyalty = async () => {
        setLoadingLoyalty(true);
        try {
          const res = await fetch(`/api/loyalty/customer/${user.uid}`);
          const data = await res.json();
          if (data.success) {
            setLoyaltyPoints(data.data.currentPoints || 0);
          }
        } catch (err) {
          console.error('Failed to fetch loyalty points', err);
        } finally {
          setLoadingLoyalty(false);
        }
      };
      fetchLoyalty();
    }
  }, [isOpen, user]);

  const rawDiscount = Math.floor(loyaltyPoints / 10);
  const loyaltyDiscount = useLoyaltyPoints ? Math.min(rawDiscount, totalAmount) : 0;
  const finalAmountToPay = totalAmount - loyaltyDiscount;

  const handlePayNow = async () => {
    if (!user || !razorpayLoaded) {
      setError('Payment system not ready. Please wait a moment.');
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setCurrentStep('processing');

      // Step 1: Create booking + Razorpay order
      const slotsData = selectedSlots.map(slot => ({
        ...slot,
        date: format(slot.date, 'yyyy-MM-dd'),
      }));

      const createResponse = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user.uid,
          ownerId: turf.ownerId,
          turfId: turf._id,
          slots: slotsData,
          totalAmount,
          useLoyaltyPoints,
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        if (createData.code === 'SLOT_CONFLICT') {
          const unavailableText = createData.unavailableSlots
            ?.map((s: any) => `${s.startTime}-${s.endTime}`)
            .join(', ');
          throw new Error(
            `Some slots are no longer available: ${unavailableText}. Please close and select different time slots.`
          );
        }
        throw new Error(createData.error || 'Failed to create booking');
      }

      // Hide our dialog so it doesn't block Razorpay's iframe
      setRazorpayOpen(true);

      // Step 2: Open Razorpay checkout
      const options = {
        key: createData.key,
        amount: createData.amount * 100,
        currency: createData.currency,
        name: 'OutFyld',
        description: `Booking at ${turf.businessName}`,
        order_id: createData.orderId,
        handler: async function (response: any) {
          // Razorpay closed after payment — restore our dialog
          setRazorpayOpen(false);
          // Step 3: Verify payment
          try {
            setCurrentStep('processing');
            const verifyResponse = await fetch('/api/bookings/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingIds: createData.bookingIds,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            setCurrentStep('success');
            setProcessing(false);

            // Auto-close after 3 seconds
            setTimeout(() => {
              onSuccess();
              onClose();
              resetModal();
            }, 3000);
          } catch (verifyError: any) {
            setError(verifyError.message || 'Payment verification failed');
            setCurrentStep('error');
            setProcessing(false);
          }
        },
        prefill: createData.prefill,
        notes: {
          turfId: turf._id,
          slotCount: selectedSlots.length.toString(),
        },
        theme: {
          color: '#16a34a',
        },
        modal: {
          ondismiss: function () {
            // Razorpay dismissed — restore our dialog
            setRazorpayOpen(false);
            
            // Don't reset if payment success handler is already processing
            setCurrentStep((prev) => {
              if (prev === 'processing' || prev === 'success') {
                return prev;
              }
              setProcessing(false);
              return 'ready';
            });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setRazorpayOpen(false);
        setError(`Payment failed: ${response.error.description}`);
        setCurrentStep('error');
        setProcessing(false);
      });
      rzp.open();
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
      setCurrentStep('error');
      setProcessing(false);
    }
  };

  const resetModal = () => {
    setCurrentStep('ready');
    setError(null);
    setProcessing(false);
  };

  const handleClose = () => {
    if (!processing) {
      resetModal();
      onClose();
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />
      <Dialog open={isOpen} onOpenChange={handleClose} modal={!razorpayOpen}>
        <DialogContent 
          className={cn(
            "max-w-md max-h-[90vh] overflow-y-auto",
            razorpayOpen && "opacity-0 pointer-events-none"
          )}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Complete Your Booking</DialogTitle>
              {paymentTimer > 0 && (
                <div className="text-sm text-orange-600 font-medium">
                  ⏰ {Math.floor(paymentTimer / 60)}:{(paymentTimer % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
            <DialogDescription>
              Pay securely via Razorpay to confirm your booking
              {paymentTimer > 0 && (
                <span className="block text-orange-600 mt-1">
                  Complete payment within {Math.floor(paymentTimer / 60)} minutes to secure your slots
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Booking Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Turf:</span>
                <span className="font-medium">{turf.businessName}</span>
              </div>
              <div className="text-sm">
                <span>Slots ({selectedSlots.length}):</span>
                <div className="mt-1 space-y-1">
                  {selectedSlots.map((slot, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-600">
                        {format(slot.date, 'MMM d')}, {slot.startTime} - {slot.endTime}
                      </span>
                      <span className="font-medium">₹{turf.pricing}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />

              {loyaltyPoints > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-purple-700">Use Loyalty Points</span>
                    <span className="text-xs text-gray-500">
                      Balance: {loyaltyPoints} pts (₹{rawDiscount} value)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={useLoyaltyPoints}
                      onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                      disabled={loadingLoyalty || processing}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span>₹{totalAmount}</span>
                </div>
                {useLoyaltyPoints && (
                  <div className="flex justify-between text-sm text-purple-600">
                    <span>Loyalty Discount:</span>
                    <span>-₹{loyaltyDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-1">
                  <span>Total Payable:</span>
                  <span className="text-green-600">₹{finalAmountToPay}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          <div className="mt-4">
            {currentStep === 'ready' && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <CreditCard className="h-10 w-10 mx-auto text-green-600 mb-3" />
                  <h3 className="text-lg font-semibold mb-1">Secure Payment</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    Pay via UPI, Card, Net Banking, or Wallet
                  </p>
                  <p className="text-xs text-gray-500">
                    Your booking will be confirmed instantly after payment
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handlePayNow}
                  disabled={processing || !razorpayLoaded}
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Pay ₹{finalAmountToPay} Securely
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-gray-400">
                  Secured by Razorpay. All transactions are encrypted.
                </p>
              </div>
            )}

            {currentStep === 'processing' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold mb-2">Processing Payment...</h3>
                <p className="text-gray-600">Please wait while we verify your payment.</p>
              </div>
            )}

            {currentStep === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold mb-2 text-green-700">Booking Confirmed! 🎉</h3>
                <p className="text-gray-600 mb-4">
                  Your payment was successful and your booking is confirmed.
                </p>
                <div className="bg-green-50 p-4 rounded-lg text-left">
                  <h4 className="font-medium text-green-900 mb-2">Booking Details:</h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <p><strong>Turf:</strong> {turf.businessName}</p>
                    <div>
                      <strong>Slots ({selectedSlots.length}):</strong>
                      {selectedSlots.map((slot, index) => (
                        <div key={index} className="ml-2">
                          • {format(slot.date, 'EEEE, MMM d')}, {slot.startTime} - {slot.endTime}
                        </div>
                      ))}
                    </div>
                    {useLoyaltyPoints && (
                      <p><strong>Discount Applied:</strong> ₹{loyaltyDiscount}</p>
                    )}
                    <p><strong>Amount Paid:</strong> ₹{finalAmountToPay}</p>
                    <p><strong>Status:</strong> ✅ Confirmed</p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'error' && (
              <div className="text-center py-8">
                <XCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
                <h3 className="text-lg font-semibold mb-2 text-red-700">Payment Issue</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="flex space-x-3 justify-center">
                  <Button variant="outline" onClick={() => setCurrentStep('ready')}>
                    Try Again
                  </Button>
                  <Button onClick={handleClose}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}