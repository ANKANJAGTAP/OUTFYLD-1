'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (error: any) {
      console.error('Reset password error:', error);
      if (error.code === 'auth/user-not-found') {
          setError('No account found with this email address.');
      } else {
          setError(error.message || 'Failed to send reset email. Please try again.');
      }
    }
  };

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
          <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
          <p className="text-gray-600 mt-2">Enter your email to receive reset instructions</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Forgot Password</CardTitle>
            <CardDescription className="text-center">
                Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <Alert className="bg-green-50 border-green-200">
                  <AlertTitle className="text-green-800">Check your email</AlertTitle>
                  <AlertDescription className="text-green-700 mt-2">
                    We have sent a password reset link to <strong>{email}</strong>.
                    <br/>
                    Please check your inbox (and spam folder) and follow the instructions.
                  </AlertDescription>
                </Alert>
                <div className="pt-4">
                    <Button asChild className="w-full bg-green-500 hover:bg-green-600">
                    <Link href="/auth/login">
                        Back to Login
                    </Link>
                    </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  className="w-full bg-green-500 hover:bg-green-600" 
                  size="lg"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Sending Link...' : 'Send Reset Link'}
                </Button>

                <div className="mt-4 text-center">
                  <Link 
                    href="/auth/login" 
                    className="inline-flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
