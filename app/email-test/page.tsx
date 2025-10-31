'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EmailTestPage() {
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testEmailSending = async () => {
    if (!testEmail) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/test-email?to=${encodeURIComponent(testEmail)}`);
      const data = await response.json();
      
      setResult({
        success: response.ok,
        status: response.status,
        data
      });
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Failed to send test email'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">📧 Email Testing Dashboard</h1>

      {/* Email Configuration Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>📋 Email Configuration Status</CardTitle>
          <CardDescription>
            Check your email configuration in .env.local
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <div><strong>Required Environment Variables:</strong></div>
                <ul className="list-disc list-inside ml-4">
                  <li>EMAIL_HOST (e.g., smtp.resend.com)</li>
                  <li>EMAIL_PORT (e.g., 587)</li>
                  <li>EMAIL_USER (e.g., resend)</li>
                  <li>EMAIL_PASSWORD (your API key)</li>
                  <li>EMAIL_FROM (e.g., onboarding@resend.dev)</li>
                  <li>ENABLE_EMAIL_NOTIFICATIONS=true</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Send Test Email */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>✉️ Send Test Email</CardTitle>
          <CardDescription>
            Test the email sending functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="testEmail">Recipient Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="mt-2"
              />
            </div>

            <Button 
              onClick={testEmailSending} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Test Email'}
            </Button>

            {result && (
              <Alert className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-semibold">
                      {result.success ? '✅ Success!' : '❌ Failed'}
                    </div>
                    <div className="text-sm">
                      <strong>Status:</strong> {result.status}
                    </div>
                    <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-60">
                      {JSON.stringify(result.data || result.error, null, 2)}
                    </pre>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Flow Documentation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>📬 Email Flow Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">1. Customer Books Turf</h3>
              <p className="mb-2">API: <code>POST /api/bookings/create</code></p>
              <ul className="list-disc list-inside ml-4">
                <li>📧 Email sent to <strong>Turf Owner</strong></li>
                <li>Subject: &quot;🔔 New Booking Request&quot;</li>
                <li>Contains: Customer details, booking info</li>
                <li>Function: <code>sendBookingNotificationEmail()</code></li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold mb-2">2. Owner Confirms/Rejects Booking</h3>
              <p className="mb-2">API: <code>PUT /api/bookings/update-status</code></p>
              <ul className="list-disc list-inside ml-4">
                <li>📧 Email sent to <strong>Customer</strong></li>
                <li>Subject: &quot;✅ Booking Confirmed&quot; or &quot;❌ Booking Rejected&quot;</li>
                <li>Contains: Booking details, status</li>
                <li>Function: <code>sendBookingConfirmationEmail()</code></li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold mb-2">🔧 Troubleshooting</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Check server console logs for email errors</li>
                <li>Verify EMAIL_FROM uses verified domain (Resend: onboarding@resend.dev)</li>
                <li>Check ENABLE_EMAIL_NOTIFICATIONS=true in .env.local</li>
                <li>For Resend: Use &apos;resend&apos; as EMAIL_USER</li>
                <li>Check email password/API key is correct</li>
                <li>Look for SMTP connection errors in logs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resend Specific Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Resend SMTP Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Current Configuration (Resend.com SMTP):</p>
            <pre className="bg-gray-100 p-3 rounded overflow-auto">
{`EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=resend
EMAIL_PASSWORD=re_YourAPIKeyHere
EMAIL_FROM=OutFyld <admin@outfyld.in>
ENABLE_EMAIL_NOTIFICATIONS=true`}
            </pre>
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm font-semibold text-green-800">✅ Using Verified Domain</p>
              <p className="text-xs text-green-700 mt-1">
                Your domain <strong>admin@outfyld.in</strong> is verified on Resend. All emails will be sent from this address.
              </p>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              * Get your API key from: <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">https://resend.com/api-keys</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
