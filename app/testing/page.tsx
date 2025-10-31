'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function TestingPage() {
  const [turfId, setTurfId] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testBookingDates = async () => {
    if (!turfId.trim()) {
      alert('Please enter a turf ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/test/booking-dates/${turfId}?date1=2025-10-31&date2=2025-11-07`);
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({ error: 'Test failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Testing Dashboard</h1>
      
      {/* Date-Specific Booking Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🗓️ Date-Specific Booking Test</CardTitle>
          <CardDescription>
            ✅ FIXED: Test if bookings for Saturday Oct 31, 2025 affect other Saturdays
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg text-sm">
              <h3 className="font-semibold mb-2">✅ Issue Fixed:</h3>
              <p className="mb-2">
                <strong>Problem:</strong> When booking Saturday Oct 31, 2025, all future Saturdays showed as booked.
              </p>
              <p>
                <strong>Solution:</strong> Updated booking validation to use specific dates (slot.date) instead of just day names.
                Now each booking is tied to its exact date (YYYY-MM-DD format).
              </p>
            </div>

            <div className="flex gap-4">
              <Input
                placeholder="Enter Turf ID to test"
                value={turfId}
                onChange={(e) => setTurfId(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={testBookingDates} 
                disabled={loading}
                className="px-6"
              >
                {loading ? 'Testing...' : 'Test Booking Dates'}
              </Button>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg text-sm">
              <h3 className="font-semibold mb-2">What this test checks:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Shows bookings for Oct 31, 2025 (Saturday)</li>
                <li>Shows bookings for Nov 7, 2025 (Next Saturday)</li>
                <li>Verifies they are independent (one doesn&apos;t affect the other)</li>
              </ul>
            </div>

            {testResults && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cascade Deletion Test Instructions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🗑️ Cascade Deletion Test</CardTitle>
          <CardDescription>
            Instructions to test admin revoke owner functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">✅ NOW IMPLEMENTED - Test Steps:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Create a test turf owner account</li>
                <li>Add some turfs under that owner</li>
                <li>Create some bookings for those turfs</li>
                <li>Go to admin dashboard and revoke the owner (action=&apos;revoke&apos;)</li>
                <li>✅ The system will automatically:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Delete ALL turfs owned by that owner</li>
                    <li>Delete ALL bookings for those turfs</li>
                    <li>Delete ALL slot reservations for those turfs</li>
                    <li>Delete the owner user account completely</li>
                    <li>Turfs will immediately disappear from browse section</li>
                  </ul>
                </li>
              </ol>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold mb-2">⚡ What happens on REVOKE vs SUSPEND:</h3>
              <div className="text-sm space-y-2">
                <div>
                  <strong>REVOKE (Permanent):</strong>
                  <ul className="list-disc list-inside ml-4">
                    <li>Deletes owner account completely</li>
                    <li>CASCADE DELETES all turfs, bookings, reservations</li>
                    <li>Turfs disappear from browse immediately</li>
                    <li>Cannot be undone</li>
                  </ul>
                </div>
                <div>
                  <strong>SUSPEND (Temporary):</strong>
                  <ul className="list-disc list-inside ml-4">
                    <li>Sets owner status to &apos;pending&apos;</li>
                    <li>Keeps owner account (can be re-approved)</li>
                    <li>Turfs hidden from browse but not deleted</li>
                    <li>Reversible action</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold mb-2">API Endpoints Modified:</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><code>/api/admin/revoke-owner</code> - Complete cascade deletion</li>
                <li><code>/api/admin/reject-owner</code> - Same cleanup for rejections</li>
                <li><code>/api/turfs</code> - Filters out unverified owners</li>
                <li><code>/api/turfs/[id]</code> - Fixed date-specific booking logic</li>
                <li><code>/api/bookings/turf/[turfId]/confirmed</code> - Date-specific filtering</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.open('/admin/dashboard', '_blank')}
              className="h-12"
            >
              Admin Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/browse', '_blank')}
              className="h-12"
            >
              Browse Turfs
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/admin/manage-admins', '_blank')}
              className="h-12"
            >
              Manage Admins
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/dashboard/turf-owner', '_blank')}
              className="h-12"
            >
              Owner Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}