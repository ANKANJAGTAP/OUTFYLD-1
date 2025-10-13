'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CreditCard, Tag } from 'lucide-react';
import { useState, useRef } from 'react';

interface BookingSummaryProps {
  turf: {
    name: string;
    price: number;
    location: string;
  };
  selectedDate: Date;
  selectedSlots: string[];
  /**
   * Optional: If you already create a booking on server before upload,
   * pass the bookingId here. If not provided, this component will
   * simulate a local bookingId for demo purposes.
   */
  bookingId?: string;
}

export function BookingSummary({
  turf,
  selectedDate,
  selectedSlots,
  bookingId: initialBookingId
}: BookingSummaryProps) {
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const basePrice = turf.price * selectedSlots.length;
  const discount = promoApplied ? basePrice * 0.1 : 0; // 10% discount
  const platformFee = selectedSlots.length > 0 ? 50 : 0;
  const taxes = (basePrice - discount + platformFee) * 0.18; // 18% GST
  const totalAmount = basePrice - discount + platformFee + taxes;

  // Payment & upload states
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'processing' | 'upload' | 'uploaded'>('idle');
  const [bookingId, setBookingId] = useState<string | undefined>(initialBookingId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePromoCode = () => {
    if (promoCode.toLowerCase() === 'first10' && !promoApplied) {
      setPromoApplied(true);
    }
  };

  const validateFile = (file: File) => {
    if (!file.type.startsWith('image/')) return 'Only image files are allowed';
    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxBytes) return 'File must be smaller than 5 MB';
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    const err = validateFile(f);
    if (err) {
      setError(err);
      setSelectedFile(null);
      setPreviewUrl(null);
      // reset the input to allow reselect
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setSelectedFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(String(reader.result));
    };
    reader.readAsDataURL(f);
  };

  const handleBooking = async () => {
    if (selectedSlots.length === 0) {
      alert('Please select at least one time slot');
      return;
    }

    // Simulate payment processing and then show upload UI:
    setIsProcessingPayment(true);
    setPaymentStep('processing');
    setError(null);

    try {
      // TODO: Replace this with real integration to payment gateway (Razorpay / Stripe).
      // Example flow: create booking on server -> return bookingId -> redirect to payment page -> after payment return to upload screen
      await new Promise((r) => setTimeout(r, 900));

      // If server returned bookingId, use it. Otherwise simulate one.
      const generatedBookingId = initialBookingId ?? `booking_${Date.now()}`;
      setBookingId(generatedBookingId);

      // Mark step to upload proof
      setPaymentStep('upload');
    } catch (err) {
      console.error(err);
      setError('Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleUpload = async () => {
    setError(null);

    if (!selectedFile) {
      setError('Please select an image to upload');
      return;
    }

    if (!bookingId) {
      setError('Booking ID missing. Please try booking again.');
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to FormData and send
      const fd = new FormData();
      fd.append('paymentProof', selectedFile);
      fd.append('bookingId', bookingId);

      // TODO: Replace the below simulated upload with a real API request:
      // const res = await fetch(`/api/bookings/${bookingId}/upload-proof`, {
      //   method: 'POST',
      //   body: fd
      // });
      // const j = await res.json();
      // if (!res.ok) throw new Error(j.message || 'Upload failed');

      await new Promise((r) => setTimeout(r, 900)); // simulate upload latency

      // On success:
      setUploadSuccess(true);
      setPaymentStep('uploaded');

      // Optionally: reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Upload failed — try again');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveSelected = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="sticky top-24 max-h-[calc(100vh-6rem)]">
      <Card className="flex flex-col h-full">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-green-500" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 overflow-y-auto">
          <div>
            <h3 className="font-semibold text-lg">{turf.name}</h3>
            <p className="text-gray-600 text-sm">{turf.location}</p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <span>{selectedDate.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>

            {selectedSlots.length > 0 && (
              <div>
                <div className="flex items-center text-sm mb-2">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>Selected Slots ({selectedSlots.length})</span>
                </div>
                <div className="space-y-1">
                  {selectedSlots.map((slot, index) => (
                    <Badge key={index} variant="secondary" className="mr-1 mb-1">
                      {slot}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedSlots.length > 0 && (
            <>
              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Slot Fee ({selectedSlots.length} × ₹{turf.price})</span>
                  <span>₹{basePrice}</span>
                </div>

                {promoApplied && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount (FIRST10)</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span>Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Taxes & Fees (18%)</span>
                  <span>₹{taxes.toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Amount</span>
                  <span className="text-green-600">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="promo" className="flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Promo Code
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="promo"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={promoApplied}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePromoCode}
                    disabled={promoApplied || !promoCode}
                  >
                    {promoApplied ? 'Applied' : 'Apply'}
                  </Button>
                </div>
                {promoApplied && (
                  <p className="text-sm text-green-600">✓ 10% discount applied!</p>
                )}
              </div>

              {/* Payment button */}
              {paymentStep === 'idle' && (
                <Button
                  className="w-full bg-green-500 hover:bg-green-600"
                  size="lg"
                  onClick={handleBooking}
                  aria-live="polite"
                >
                  {isProcessingPayment ? 'Processing...' : `Proceed to Payment - ₹${totalAmount.toFixed(2)}`}
                </Button>
              )}

              {/* After "payment", show upload UI */}
              {paymentStep === 'processing' && (
                <div className="text-center py-6 text-gray-600">
                  <CreditCard className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <div>Opening payment window...</div>
                </div>
              )}

              {paymentStep === 'upload' && (
                <div className="space-y-3 max-h-60 overflow-y-auto" aria-live="polite">
                  <div className="text-sm text-gray-700">
                    <strong>Payment completed (simulated).</strong> Please upload the payment screenshot/proof so the owner can verify the booking.
                  </div>

                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      aria-label="Upload payment screenshot"
                      className="block w-full text-sm text-gray-700"
                    />

                    {error && <div className="text-sm text-red-600">{error}</div>}

                    {previewUrl && (
                      <div className="border rounded p-2">
                        <p className="text-xs text-gray-500 mb-2">Preview:</p>
                        <img src={previewUrl} alt="payment preview" className="w-full h-32 object-contain rounded" />
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-500 truncate">Selected file: {selectedFile?.name}</div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button size="sm" variant="ghost" onClick={handleRemoveSelected}>Remove</Button>
                            <Button size="sm" onClick={handleUpload} disabled={isUploading}>
                              {isUploading ? 'Uploading...' : 'Upload & Confirm'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!previewUrl && (
                      <div className="text-xs text-gray-500">Choose an image file (JPG/PNG) under 5 MB.</div>
                    )}
                  </div>
                </div>
              )}

              {paymentStep === 'uploaded' && (
                <div className="text-center py-6">
                  <div className="text-green-600 font-medium">✓ Payment screenshot uploaded</div>
                  <div className="text-xs text-gray-500 mt-2">Owner will verify and confirm your booking shortly.</div>
                </div>
              )}
            </>
          )}

          {selectedSlots.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Select date and time slots to see booking summary</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
