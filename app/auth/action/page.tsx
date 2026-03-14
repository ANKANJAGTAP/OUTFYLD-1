'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
      <div className="text-center py-10 space-y-4">
        <Loader2 className="h-10 w-10 text-green-500 animate-spin mx-auto" />
        <h3 className="text-xl font-medium text-gray-700">Verifying secure link...</h3>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-6 py-6">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <Alert className="bg-green-50 border-green-200">
          <AlertTitle className="text-green-800 text-lg">Password Changed!</AlertTitle>
          <AlertDescription className="text-green-700 mt-2">
            Your password has been successfully reset. You will be redirected to the login page momentarily.
          </AlertDescription>
        </Alert>
        <div className="pt-4">
          <Button asChild className="w-full bg-green-500 hover:bg-green-600">
            <Link href="/auth/login">
              Return to Login
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center space-y-6 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="text-left py-2">{error}</AlertDescription>
        </Alert>
        <Button asChild className="w-full bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200">
          <Link href="/auth/forgot-password">
            Request New Reset Link
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <p className="text-sm font-medium text-gray-500 mb-2">Resetting password for:</p>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium text-sm">
          {email}
        </span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
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
        
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
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

        <Button 
          className="w-full bg-green-500 hover:bg-green-600 mt-2" 
          size="lg"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating Password...
            </>
          ) : 'Save New Password'}
        </Button>
      </form>
    </>
  );
}

export default function AuthActionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-4">
            <div className="bg-green-500 rounded-lg p-2 mr-3">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-600">OutFyld</h1>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Create New Password</h2>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Secure Your Account</CardTitle>
            <CardDescription className="text-center">Enter your new strong password below</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
              </div>
            }>
              <ActionForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}