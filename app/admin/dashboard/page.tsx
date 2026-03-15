'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Shield, Users, Clock, Building, IndianRupee, User, Briefcase, FileText, Calendar, Eye } from 'lucide-react';
import Link from 'next/link';

interface Turf {
  _id: string;
  name: string;
  location: { city: string, state: string };
  pricing: number;
  isActive: boolean;
  totalBookings?: number;
  totalRevenue?: number;
  ownerName?: string;
  ownerId: {
    name: string;
    email: string;
    phone: string;
    businessName: string;
    subscriptionPlan?: string;
  };
  createdAt: string;
}

interface AnalyticsData {
  totalCustomers: number;
  totalTurfOwners: number;
  totalTurfs: number;
  totalBookings: number;
  platformRevenue: number;
}

export default function AdminDashboard() {
  const { user, firebaseUser, initialLoading } = useAuth();
  const router = useRouter();
  
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!initialLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, initialLoading, router]);

  const fetchData = async () => {
    try {
      if (!user || !firebaseUser) return;
      setLoading(true);
      
      const idToken = await firebaseUser.getIdToken();
      const headers = { 'Authorization': `Bearer ${idToken}` };

      // Fetch Analytics
      const analyticsRes = await fetch('/api/admin/analytics', { headers });
      const analyticsData = await analyticsRes.json();
      
      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      }

      // Fetch Turfs
      const turfsRes = await fetch('/api/admin/turfs', { headers });
      const turfsData = await turfsRes.json();
      
      if (turfsData.success) {
        setTurfs(turfsData.turfs || []);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (initialLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Dashboard Data...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-4 md:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm md:text-base text-gray-600">Platform Analytics and Operations Monitoring</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/manage-admins">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <Shield className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Manage </span>Admins
              </Button>
            </Link>
            <Link href="/admin/careers/jobs">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <Briefcase className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Manage </span>Jobs
              </Button>
            </Link>
            <Link href="/admin/careers/applications">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">View </span>Applications
              </Button>
            </Link>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleLogout}
              className="text-xs sm:text-sm"
            >
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Analytics Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                <span>Total Revenue</span>
                <IndianRupee className="w-4 h-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                ₹{analytics?.platformRevenue?.toLocaleString('en-IN') || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                <span>Total Bookings</span>
                <Calendar className="w-4 h-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">{analytics?.totalBookings || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                <span>Active Turfs</span>
                <Building className="w-4 h-4 text-yellow-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">{analytics?.totalTurfs || 0}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                <span>Network Users</span>
                <Users className="w-4 h-4 text-purple-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                 {((analytics?.totalCustomers || 0) + (analytics?.totalTurfOwners || 0))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {analytics?.totalCustomers || 0} Customers &middot; {analytics?.totalTurfOwners || 0} Owners
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Verified Turfs Table */}
        <Card className="mb-8 shadow-sm">
          <CardHeader>
            <CardTitle>Active Turfs</CardTitle>
            <CardDescription>All publicly listed turf facilities currently on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {turfs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No active turfs found</p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turf Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {turfs.map((turf) => (
                    <TableRow key={turf._id}>
                      <TableCell className="font-medium text-blue-600 hover:underline cursor-pointer" onClick={() => router.push(`/turf/${turf._id}`)}>
                         {turf.name}
                      </TableCell>
                      <TableCell>{turf.location?.city || '-'}, {turf.location?.state || '-'}</TableCell>
                      <TableCell>
                          <div>
                            <p className="text-sm font-medium">
                              {turf.ownerName || (typeof turf.ownerId === 'object' ? turf.ownerId?.name : 'Unknown Owner')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {typeof turf.ownerId === 'object' ? turf.ownerId?.businessName : '-'}
                            </p>
                          </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View More
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Turf Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Turf Name</p>
                                  <p className="font-medium">{turf.name}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Location</p>
                                  <p className="font-medium">{turf.location?.city || '-'}, {turf.location?.state || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Owner</p>
                                  <p className="font-medium">
                                    {turf.ownerName || (typeof turf.ownerId === 'object' ? turf.ownerId?.name : 'Unknown Owner')}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Pricing</p>
                                  <p className="font-medium">₹{turf.pricing}/hr</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Registered On</p>
                                  <p className="font-medium">{turf.createdAt ? new Date(turf.createdAt).toLocaleDateString() : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Subscription Plan</p>
                                  <p className="font-medium capitalize">
                                    {typeof turf.ownerId === 'object' ? turf.ownerId?.subscriptionPlan || 'Basic' : 'Basic'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Total Bookings</p>
                                  <p className="font-medium">{turf.totalBookings || 0}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Total Revenue</p>
                                  <p className="font-medium">₹{(turf.totalRevenue || 0).toLocaleString('en-IN')}</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
