'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Upload, Shield, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { NightShell } from '@/components/night/NightShell';
import { NightLoader } from '@/components/night/NightLoader';
import { NightInput, nightCard, nightPrimaryBtn, StatusDot } from '@/components/night/ui';
import { Reveal } from '@/components/landing/night-match/Reveal';

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
      <NightShell ambient={0.4}>
        <div className="flex min-h-screen items-center justify-center">
          <NightLoader label="Unlocking the club office…" />
        </div>
      </NightShell>
    );
  }

  return (
    <NightShell ambient={0.4}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {/* ── masthead ── */}
        <Reveal>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="group mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 ease-night group-hover:-translate-x-1" />
            Back to control room
          </button>

          <div>
            <p className="nm-overline mb-3 flex items-center gap-2 text-flood-500">
              <Shield className="h-4 w-4" />
              Control room
            </p>
            <h1 className="nm-display-l text-chalk-100">Club settings</h1>
            <p className="mt-2 text-sm text-chalk-400">
              Manage payment QR code for owner subscriptions
            </p>
          </div>
        </Reveal>

        {error && (
          <div className="mt-6 rounded-[4px] border border-red-700/60 bg-red-950/40 px-4 py-3">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-center gap-2 rounded-[4px] border border-flood-500/40 bg-pitch-700/80 px-4 py-3">
            <StatusDot tone="lime" />
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-flood-500">{success}</p>
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Current QR Code */}
          <Reveal delay={0.08}>
            <div className={`${nightCard} overflow-hidden`}>
              <div className="border-b border-pitchline/60 px-6 py-4">
                <p className="nm-overline text-chalk-400">On the board</p>
                <h2 className="mt-1 font-display text-xl uppercase tracking-tight text-chalk-100">
                  Current payment QR
                </h2>
                <p className="mt-1 text-xs text-chalk-400">
                  This QR code is shown to turf owners during subscription
                </p>
              </div>
              <div className="p-6">
                {currentQR ? (
                  <div className="relative aspect-square w-full overflow-hidden rounded-[4px] border border-pitchline bg-chalk-100">
                    <Image
                      src={currentQR}
                      alt="Current Payment QR"
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-[4px] border border-dashed border-pitchline">
                    <p className="px-4 text-center font-mono text-xs uppercase tracking-[0.12em] text-chalk-400">
                      No QR code uploaded yet.<br />Upload one to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Reveal>

          {/* Upload New QR Code */}
          <Reveal delay={0.14}>
            <div className={`${nightCard} overflow-hidden`}>
              <div className="border-b border-pitchline/60 px-6 py-4">
                <p className="nm-overline text-chalk-400">New season</p>
                <h2 className="mt-1 font-display text-xl uppercase tracking-tight text-chalk-100">
                  Upload new QR code
                </h2>
                <p className="mt-1 text-xs text-chalk-400">
                  Upload a new payment QR code image
                </p>
              </div>
              <div className="space-y-4 p-6">
                <div className="space-y-2">
                  <label htmlFor="qr-upload" className="nm-overline block text-chalk-400">
                    Select QR code image
                  </label>
                  <NightInput
                    id="qr-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer file:mr-4 file:cursor-pointer file:rounded-[4px] file:border-0 file:bg-pitch-900 file:px-3 file:py-1 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.12em] file:text-chalk-100"
                  />
                </div>

                {qrPreview && (
                  <div className="relative aspect-square w-full overflow-hidden rounded-[4px] border border-pitchline bg-chalk-100">
                    <Image
                      src={qrPreview}
                      alt="QR Preview"
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !qrImage}
                  className={`${nightPrimaryBtn} w-full`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload QR code
                    </>
                  )}
                </button>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Instructions */}
        <Reveal delay={0.18}>
          <div className={`${nightCard} mt-6 px-6 py-5`}>
            <p className="nm-overline text-flood-500">Match-day instructions</p>
            <ol className="mt-4 space-y-2 text-sm leading-relaxed text-chalk-400">
              {[
                'Generate a UPI QR code from your payment app (Google Pay, PhonePe, Paytm, etc.)',
                'Save the QR code image to your device',
                'Upload the image using the form above',
                'Turf owners will see this QR code when selecting their subscription plan',
                'Update this QR code anytime by uploading a new image',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-mono text-xs tabular-nums text-flood-500">{String(i + 1).padStart(2, '0')}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </NightShell>
  );
}
