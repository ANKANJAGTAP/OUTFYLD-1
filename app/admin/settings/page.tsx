'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Shield } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user, initialLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (!initialLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    } else if (!initialLoading) {
      setLoading(false);
    }
  }, [user, initialLoading, router]);

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
              <p className="text-gray-600">General platform settings</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
            <CardDescription>
              Configure the platform parameters below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">No settings available at the moment.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
