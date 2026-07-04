'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { sendEmailVerification } from 'firebase/auth';
import { NightShell } from '@/components/night/NightShell';
import { nightGhostBtn, Mono } from '@/components/night/ui';

export default function VerifyEmailPage() {
  const { firebaseUser, logout, isEmailVerified } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Check if email is already verified
  useEffect(() => {
    if (isEmailVerified() && firebaseUser) {
      // Redirect to appropriate dashboard
      window.location.href = '/';
    }
  }, [isEmailVerified, firebaseUser]);

  const handleResendVerification = async () => {
    if (!firebaseUser) return;

    setIsResending(true);
    setMessage('');
    setError('');

    try {
      const actionCodeSettings = {
        url: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/login`,
        handleCodeInApp: false,
      };

      console.log('Resending email verification to:', firebaseUser.email);
      console.log('Action code settings:', actionCodeSettings);

      await sendEmailVerification(firebaseUser, actionCodeSettings);
      setMessage('Verification email sent! Please check your inbox and spam folder.');
      console.log('Email verification sent successfully');
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      console.error('Email error details:', {
        code: error.code,
        message: error.message
      });

      let errorMessage = 'Failed to send verification email. ';
      if (error.code === 'auth/too-many-requests') {
        errorMessage += 'Too many requests. Please try again later.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }

      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!firebaseUser) return;

    try {
      // Reload user to get updated email verification status
      await firebaseUser.reload();

      if (firebaseUser.emailVerified) {
        setMessage('Email verified successfully! Redirecting...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError('Email is not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (error: any) {
      console.error('Error checking verification status:', error);
      setError('Failed to check verification status');
    }
  };

  if (!firebaseUser) {
    return (
      <NightShell className="flex items-center justify-center p-6">
        <div className="relative z-[2] w-full max-w-md py-10">
          <div className="rounded-[4px] border border-pitchline bg-pitch-700/90 p-8 text-center backdrop-blur-sm md:p-10">
            <p className="nm-overline mb-2 text-flood-500">The turnstile</p>
            <h1 className="font-display text-3xl uppercase tracking-tight text-chalk-100">
              Access denied
            </h1>
            <p className="mt-3 text-sm text-chalk-400">
              You need to be logged in to access this page.
            </p>
            <Link
              href="/auth/login"
              className="nm-overline group mt-6 flex h-12 w-full items-center justify-center rounded-[4px] bg-flood-500 text-pitch-900 shadow-flood transition-[transform,box-shadow,background-color] duration-200 ease-night hover:bg-flood-600 active:translate-y-[2px] active:shadow-none"
            >
              Go to login
            </Link>
          </div>
        </div>
      </NightShell>
    );
  }

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
            Verify your email
          </h1>
          <p className="mt-1.5 text-sm text-chalk-400">
            We&apos;ve sent a verification email to
          </p>
          <Mono className="mt-1 block text-sm text-chalk-100">{firebaseUser.email}</Mono>

          {message && (
            <div className="mt-5 flex items-start gap-2 rounded-[3px] border border-flood-500/50 bg-flood-500/[0.07] px-3.5 py-3 text-sm text-chalk-100">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-flood-500" />
              {message}
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-[3px] border border-red-900/60 bg-red-950/30 px-3.5 py-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* match-day instructions */}
          <div className="mt-6 rounded-[4px] border border-pitchline bg-pitch-800/80 p-4">
            <p className="nm-overline mb-3 text-chalk-400">Next steps</p>
            <ol className="space-y-2 text-sm text-chalk-400">
              <li className="flex gap-3">
                <Mono className="text-flood-500">01</Mono>
                Check your email inbox (including spam folder)
              </li>
              <li className="flex gap-3">
                <Mono className="text-flood-500">02</Mono>
                Click the verification link in the email
              </li>
              <li className="flex gap-3">
                <Mono className="text-flood-500">03</Mono>
                Return here and click &quot;I&apos;ve verified my email&quot;
              </li>
            </ol>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleCheckVerification}
              className="nm-overline group flex h-12 w-full items-center justify-center rounded-[4px] bg-flood-500 text-pitch-900 shadow-flood transition-[transform,box-shadow,background-color] duration-200 ease-night hover:bg-flood-600 active:translate-y-[2px] active:shadow-none"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              I&apos;ve verified my email
            </button>

            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className={`${nightGhostBtn} h-12 w-full`}
            >
              {isResending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {isResending ? 'Sending…' : 'Resend verification email'}
            </button>

            <button
              onClick={logout}
              className="w-full py-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400 transition-colors duration-200 ease-night hover:text-chalk-100"
            >
              Sign out
            </button>
          </div>

          <p className="mt-6 border-t border-pitchline/60 pt-5 text-center text-sm text-chalk-400">
            Having trouble?{' '}
            <a
              href="mailto:admin@outfyld.in"
              className="font-medium text-flood-500 transition-colors hover:text-flood-600"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </NightShell>
  );
}
