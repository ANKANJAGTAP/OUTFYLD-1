'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Phone, Mail, Building, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

function OwnerProfile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
        
        <Card className="mb-6 shadow-sm border-0 ring-1 ring-gray-200">
          <CardHeader className="bg-white border-b border-gray-100 flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-xl">Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="text-base text-gray-900">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email Address</p>
                  <p className="text-base text-gray-900">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact Number</p>
                  <p className="text-base text-gray-900">{user.phone || 'Not provided'}</p>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 ring-1 ring-gray-200">
          <CardHeader className="bg-white border-b border-gray-100 pb-4">
            <CardTitle className="text-xl">Business Information</CardTitle>
            <CardDescription>Details about your turf business</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              
              <div className="flex items-center">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Building className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Business Name</p>
                  <p className="text-base text-gray-900">{user.businessName || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-base capitalize text-gray-900">
                    {user.verificationStatus === 'approved' ? (
                       <span className="text-green-600 font-semibold">Verified</span>
                    ) : (
                       <span className="text-yellow-600 font-semibold">{user.verificationStatus}</span>
                    )}
                  </p>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default function OwnerProfilePage() {
  return (
    <ProtectedRoute requireRole="owner">
      <OwnerProfile />
    </ProtectedRoute>
  );
}
