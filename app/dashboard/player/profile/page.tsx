'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Phone, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';

function PlayerProfile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard/player">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border hover:bg-green-50">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <User className="h-6 w-6 text-green-600" />
              My Profile
            </h1>
            <p className="text-sm text-gray-500">Manage your personal information</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>View and edit your profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="flex items-center space-x-4 pb-6 border-b">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-3xl font-bold">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <Badge variant="secondary" className="bg-green-100 text-green-800 mt-1">Customer Account</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center text-gray-700">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  Full Name
                </label>
                <Input value={user.name || ''} readOnly className="bg-gray-50" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center text-gray-700">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  Email Address
                </label>
                <Input value={user.email || ''} readOnly className="bg-gray-50" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center text-gray-700">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  Phone Number
                </label>
                <Input value={user.phone || ''} readOnly className="bg-gray-50" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center text-gray-700">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  City
                </label>
                <Input value="Sangli, Maharashtra" readOnly className="bg-gray-50 text-gray-500" />
                <p className="text-xs text-gray-500">City preferences can be changed during booking.</p>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
               <Button className="bg-green-600 hover:bg-green-700">
                 Edit Profile
               </Button>
            </div>

          </CardContent>
        </Card>

      </main>
    </div>
  );
}

export default function PlayerProfilePage() {
  return (
    <ProtectedRoute requireRole="customer">
      <PlayerProfile />
    </ProtectedRoute>
  );
}
