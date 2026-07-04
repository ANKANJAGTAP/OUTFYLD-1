'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Lock, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { NightShell } from '@/components/night/NightShell';
import { NightLoader } from '@/components/night/NightLoader';
import { NightInput, nightGhostBtn, Mono } from '@/components/night/ui';

const label = 'mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400';

function ActionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!oobCode || mode !== 'resetPassword') {
      setError('Invalid or missing authentication code.');
      setVerifying(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail);
        setVerifying(false);
      })
      .catch((error) => {
        console.error('Code verification error:', error);
        setError('The password reset link is invalid or has expired. Please request a new one.');
        setVerifying(false);
      });
  }, [oobCode, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (oobCode) {
        await confirmPasswordReset(auth, oobCode, newPassword);
        setSuccess(true);
        // Automatically redirect to login after a few seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 4000);
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to securely reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex justify-center py-10">
        <NightLoader label="Verifying secure link…" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6 py-4">
        <div className="flex items-start gap-2 rounded-[3px] border border-flood-500/50 bg-flood-500/[0.07] px-3.5 py-3 text-sm text-chalk-100">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-flood-500" />
          <span>
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-flood-500">
              Password changed
            </span>
            Your password has been successfully reset. You will be redirected to the login page
            momentarily.
          </span>
        </div>
        <Link
          href="/auth/login"
          className="nm-overline group flex h-12 w-full items-center justify-center rounded-[4px] bg-flood-500 text-pitch-900 shadow-flood transition-[transform,box-shadow,background-color] duration-200 ease-night hover:bg-flood-600 active:translate-y-[2px] active:shadow-none"
        >
          Return to login
          <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-200 ease-night group-hover:translate-x-1" />
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 py-4">
        <div className="flex items-start gap-2 rounded-[3px] border border-red-900/60 bg-red-950/30 px-3.5 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
        <Link href="/auth/forgot-password" className={`${nightGhostBtn} h-12 w-full`}>
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 border-t border-pitchline/60 pt-5">
        <p className="nm-overline mb-1.5 text-chalk-400">Resetting password for</p>
        <Mono className="text-sm text-chalk-100">{email}</Mono>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label} htmlFor="new-password">
            New password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400/50" />
            <NightInput
              id="new-password"
              type="password"
              placeholder="Enter new password"
              className="pl-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </div>

        <div>
          <label className={label} htmlFor="confirm-password">
            Confirm new password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400/50" />
            <NightInput
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              className="pl-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="nm-overline group flex h-12 w-full items-center justify-center rounded-[4px] bg-flood-500 text-pitch-900 shadow-flood transition-[transform,box-shadow,background-color] duration-200 ease-night hover:bg-flood-600 active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-40"
        >
          {loading ? (
            'Updating password…'
          ) : (
            <span className="flex items-center justify-center">
              Save new password
              <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-200 ease-night group-hover:translate-x-1" />
            </span>
          )}
        </button>
      </form>
    </>
  );
}

export default function AuthActionPage() {
  return (
    <NightShell className="flex items-center justify-center p-6">
      <div className="relative z-[2] w-full max-w-md py-10">
        {/* wordmark */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center">
            <Image
              src="/images/logo.png"
              alt="OutFyld Logo"
              width={64}
              height={64}
              className="mb-2 object-contain brightness-0 invert"
              priority
            />
            <span className="font-display text-2xl uppercase tracking-tight text-chalk-100">
              OutFyld
            </span>
          </Link>
        </div>

        {/* THE TURNSTILE */}
        <div className="rounded-[4px] border border-pitchline bg-pitch-700/90 p-8 backdrop-blur-sm md:p-10">
          <p className="nm-overline mb-2 text-flood-500">The turnstile</p>
          <h1 className="font-display text-4xl uppercase tracking-tight text-chalk-100">
            New password
          </h1>
          <p className="mb-6 mt-1.5 text-sm text-chalk-400">
            Secure your account with a new strong password.
          </p>

          <Suspense
            fallback={
              <div className="flex justify-center py-10">
                <NightLoader label="Warming up…" />
              </div>
            }
          >
            <ActionForm />
          </Suspense>
        </div>
      </div>
    </NightShell>
  );
}
