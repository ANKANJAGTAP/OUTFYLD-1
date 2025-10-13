'use client';

import React, { useState, useRef } from 'react';
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
import { Loader2, Upload, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  turf: {
    _id: string;
    ownerId: string; // Add ownerId field
    businessName: string;
    pricing: number;
    upiQrCode: {
      url: string;
      public_id: string;
    };
  };
  selectedSlot: {
    day: string;
    date: Date;
    startTime: string;
    endTime: string;
  };
  totalAmount: number;
  onSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  turf,
  selectedSlot,
  totalAmount,
  onSuccess
}: PaymentModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'payment' | 'upload' | 'processing' | 'success' | 'error'>('payment');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }

      setPaymentScreenshot(file);
      setError(null);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    setPaymentScreenshot(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitBooking = async () => {
    if (!paymentScreenshot || !user) {
      setError('Payment screenshot and user authentication are required');
      return;
    }

    try {
      setUploading(true);
      setCurrentStep('processing');
      setError(null);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('customerId', user.uid);
      formData.append('ownerId', turf.ownerId); // The turf owner's user ID
      formData.append('turfId', turf._id);
      
      // Prepare slot data with date as string
      const slotData = {
        ...selectedSlot,
        date: format(selectedSlot.date, 'yyyy-MM-dd')
      };
      formData.append('slot', JSON.stringify(slotData));
      formData.append('totalAmount', totalAmount.toString());
      formData.append('paymentScreenshot', paymentScreenshot);

      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const result = await response.json();
      console.log('Booking created successfully:', result);

      setCurrentStep('success');
      
      // Auto-close after 3 seconds and trigger success callback
      setTimeout(() => {
        onSuccess();
        onClose();
        resetModal();
      }, 3000);

    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setCurrentStep('error');
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setCurrentStep('payment');
    setPaymentScreenshot(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!uploading) {
      resetModal();
      onClose();
    }
  };

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Scan QR Code to Pay</h3>
        <p className="text-gray-600 mb-4">
          Scan the QR code below with your UPI app to make the payment of ₹{totalAmount}
        </p>
      </div>

      <div className="flex justify-center">
        <div className="relative w-64 h-64 border-2 border-gray-200 rounded-lg overflow-hidden">
          <Image
            src={turf.upiQrCode.url}
            alt="UPI QR Code"
            fill
            sizes="256px"
            className="object-contain"
          />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Payment Instructions:</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Open your UPI app (GPay, PhonePe, Paytm, etc.)</li>
          <li>2. Scan the QR code above</li>
          <li>3. Pay exactly ₹{totalAmount}</li>
          <li>4. Take a screenshot of the payment confirmation</li>
          <li>5. Upload the screenshot below</li>
        </ol>
      </div>

      <Button 
        onClick={() => setCurrentStep('upload')} 
        className="w-full"
      >
        I've Made the Payment - Upload Screenshot
      </Button>
    </div>
  );

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Upload Payment Screenshot</h3>
        <p className="text-gray-600">
          Please upload a clear screenshot of your payment confirmation
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative w-32 h-32 mx-auto">
              <Image
                src={previewUrl}
                alt="Payment Screenshot Preview"
                fill
                sizes="128px"
                className="object-cover rounded-lg"
              />
            </div>
            <div className="flex justify-center space-x-2">
              <Button variant="outline" onClick={handleRemoveFile}>
                Remove
              </Button>
              <Button onClick={() => fileInputRef.current?.click()}>
                Change Image
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">Click to upload payment screenshot</p>
            <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex space-x-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('payment')}
          disabled={uploading}
          className="flex-1"
        >
          Back
        </Button>
        <Button 
          onClick={handleSubmitBooking}
          disabled={!paymentScreenshot || uploading}
          className="flex-1"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Booking...
            </>
          ) : (
            'Submit Booking Request'
          )}
        </Button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center py-8">
      <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
      <h3 className="text-lg font-semibold mb-2">Processing Your Booking</h3>
      <p className="text-gray-600">
        Please wait while we create your booking request...
      </p>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center py-8">
      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
      <h3 className="text-lg font-semibold mb-2 text-green-700">Booking Request Submitted!</h3>
      <p className="text-gray-600 mb-4">
        Your booking request has been sent to the turf owner. You'll be notified once it's reviewed.
      </p>
      <div className="bg-green-50 p-4 rounded-lg text-left">
        <h4 className="font-medium text-green-900 mb-2">Booking Details:</h4>
        <div className="text-sm text-green-800 space-y-1">
          <p><strong>Turf:</strong> {turf.businessName}</p>
          <p><strong>Slot:</strong> {format(selectedSlot.date, 'EEEE, MMM d')}, {selectedSlot.startTime} - {selectedSlot.endTime}</p>
          <p><strong>Amount:</strong> ₹{totalAmount}</p>
          <p><strong>Status:</strong> Pending Approval</p>
        </div>
      </div>
    </div>
  );

  const renderErrorStep = () => (
    <div className="text-center py-8">
      <XCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
      <h3 className="text-lg font-semibold mb-2 text-red-700">Booking Failed</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <div className="flex space-x-3 justify-center">
        <Button variant="outline" onClick={() => setCurrentStep('upload')}>
          Try Again
        </Button>
        <Button onClick={handleClose}>
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
          <DialogDescription>
            Follow the steps below to complete your turf booking
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
            <div className="flex justify-between text-sm">
              <span>Date & Time:</span>
              <span className="font-medium">
                {format(selectedSlot.date, 'EEEE, MMM d')}, {selectedSlot.startTime} - {selectedSlot.endTime}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total Amount:</span>
              <span className="text-green-600">₹{totalAmount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <div className="mt-6 flex-1 overflow-y-auto">
          {currentStep === 'payment' && renderPaymentStep()}
          {currentStep === 'upload' && renderUploadStep()}
          {currentStep === 'processing' && renderProcessingStep()}
          {currentStep === 'success' && renderSuccessStep()}
          {currentStep === 'error' && renderErrorStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}