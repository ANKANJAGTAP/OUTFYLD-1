'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { sendEmailVerification } from 'firebase/auth';

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
      await sendEmailVerification(firebaseUser);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      setError(error.message || 'Failed to send verification email');
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-gray-600 text-center mb-4">
              You need to be logged in to access this page.
            </p>
            <Link href="/auth/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
            <Mail className="h-10 w-10 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription className="text-gray-600">
            We've sent a verification email to:
            <br />
            <strong>{firebaseUser.email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Next steps:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Check your email inbox (including spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>Return here and click "I've Verified My Email"</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleCheckVerification}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              I've Verified My Email
            </Button>

            <Button 
              onClick={handleResendVerification}
              variant="outline"
              className="w-full"
              disabled={isResending}
            >
              {isResending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </Button>

            <Button 
              onClick={logout}
              variant="ghost"
              className="w-full text-gray-500"
            >
              Sign Out
            </Button>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Having trouble?{' '}
              <a href="mailto:admin@outfyld.in" className="text-green-600 hover:underline">
                Contact Support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}