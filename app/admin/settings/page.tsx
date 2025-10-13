'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Shield } from 'lucide-react';
import Image from 'next/image';

export default function AdminSettingsPage() {
  const { user, initialLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [qrImage, setQrImage] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [currentQR, setCurrentQR] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!initialLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, initialLoading, router]);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        if (data.success && data.settings?.adminPaymentQR) {
          setCurrentQR(data.settings.adminPaymentQR.url);
        }
      } catch (err: any) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchSettings();
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'turf_booking');
    formData.append('folder', 'admin_qr');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      public_id: data.public_id
    };
  };

  const handleSubmit = async () => {
    if (!qrImage) {
      setError('Please select a QR code image');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Upload to Cloudinary
      const uploadedImage = await uploadToCloudinary(qrImage);

      // Save to database
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPaymentQR: uploadedImage,
          adminUid: user?.uid
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setSuccess('Payment QR code updated successfully!');
      setCurrentQR(uploadedImage.url);
      setQrImage(null);
      setQrPreview(null);

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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
              <p className="text-gray-600">Manage payment QR code for owner subscriptions</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
            Back to Dashboard
          </Button>
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

        <div className="grid md:grid-cols-2 gap-6">
          {/* Current QR Code */}
          <Card>
            <CardHeader>
              <CardTitle>Current Payment QR Code</CardTitle>
              <CardDescription>
                This QR code is shown to turf owners during subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentQR ? (
                <div className="relative w-full aspect-square border-2 border-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={currentQR}
                    alt="Current Payment QR"
                    fill
                    className="object-contain p-4"
                  />
                </div>
              ) : (
                <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 text-center px-4">
                    No QR code uploaded yet.<br />Upload one to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload New QR Code */}
          <Card>
            <CardHeader>
              <CardTitle>Upload New QR Code</CardTitle>
              <CardDescription>
                Upload a new payment QR code image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr-upload">Select QR Code Image</Label>
                <Input
                  id="qr-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
              </div>

              {qrPreview && (
                <div className="relative w-full aspect-square border-2 border-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={qrPreview}
                    alt="QR Preview"
                    fill
                    className="object-contain p-4"
                  />
                </div>
              )}

              <Button 
                onClick={handleSubmit} 
                disabled={submitting || !qrImage}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload QR Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>1. Generate a UPI QR code from your payment app (Google Pay, PhonePe, Paytm, etc.)</p>
            <p>2. Save the QR code image to your device</p>
            <p>3. Upload the image using the form above</p>
            <p>4. Turf owners will see this QR code when selecting their subscription plan</p>
            <p>5. Update this QR code anytime by uploading a new image</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
