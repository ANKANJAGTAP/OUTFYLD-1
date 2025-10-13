'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Calendar, 
  Users, 
  TrendingUp, 
  MapPin, 
  Settings,
  Plus,
  BarChart3,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Turf {
  _id: string;
  name: string;
  description: string;
  images: Array<{ url: string; public_id: string }>;
  sportsOffered: string[];
  pricing: number;
  location: {
    address?: string;
    city?: string;
    state?: string;
  };
  isActive: boolean;
  rating?: number;
  reviewCount?: number;
}

interface BookingStats {
  [turfId: string]: {
    pending: number;
    confirmed: number;
    total: number;
  };
}

function OwnerDashboard() {
  const { user, firebaseUser, logout } = useAuth();
  const router = useRouter();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bookingStats, setBookingStats] = useState<BookingStats>({});

  // No subscription check redirect - owner can always view dashboard
  // Subscription check happens when clicking "Add Turf" button

  // Fetch turfs on component mount
  useEffect(() => {
    if (!user || !firebaseUser) {
      setLoading(false);
      return;
    }
    const fetchTurfs = async () => {
      if (!firebaseUser) return;
      
      setLoading(true);
      try {
        const idToken = await firebaseUser.getIdToken();
        const response = await fetch('/api/turfs/manage', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTurfs(data.turfs || []);
          
          // Fetch booking stats for each turf
          const stats: BookingStats = {};
          for (const turf of data.turfs || []) {
            try {
              const bookingResponse = await fetch(`/api/bookings/owner/${user.uid}?turfId=${turf._id}`, {
                headers: {
                  'Authorization': `Bearer ${idToken}`,
                },
              });
              
              if (bookingResponse.ok) {
                const bookingData = await bookingResponse.json();
                const bookings = bookingData.bookings || [];
                stats[turf._id] = {
                  pending: bookings.filter((b: any) => b.status === 'pending').length,
                  confirmed: bookings.filter((b: any) => b.status === 'confirmed').length,
                  total: bookings.length,
                };
              }
            } catch (err) {
              console.error(`Error fetching bookings for turf ${turf._id}:`, err);
            }
          }
          setBookingStats(stats);
        }
      } catch (error) {
        console.error('Error fetching turfs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTurfs();
  }, [firebaseUser, user]);

  const handleDeleteTurf = async (turfId: string) => {
    if (!firebaseUser) return;
    if (!confirm('Are you sure you want to delete this turf? This action cannot be undone.')) return;

    setDeleting(turfId);
    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/turfs/manage', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ turfId }),
      });

      if (response.ok) {
        setTurfs(turfs.filter(turf => turf._id !== turfId));
      } else {
        alert('Failed to delete turf');
      }
    } catch (error) {
      console.error('Error deleting turf:', error);
      alert('Error deleting turf');
    } finally {
      setDeleting(null);
    }
  };

  // Handle Add Turf button click - check subscription first
  const handleAddTurf = async () => {
    if (!user?.uid) return;

    try {
      // Check if owner has selected a subscription plan
      const response = await fetch(`/api/owner/subscription?uid=${user.uid}`);
      const data = await response.json();

      if (data.success) {
        if (!data.subscription.subscriptionPlan) {
          // No plan selected - redirect to subscription page
          router.push('/owner/subscription');
          return;
        }

        if (data.subscription.verificationStatus === 'pending') {
          // Plan selected but not approved yet
          alert('Your subscription is pending admin approval. You will be able to add turfs once approved.');
          return;
        }

        if (data.subscription.verificationStatus === 'rejected') {
          // Plan rejected
          alert(`Your subscription was rejected. Reason: ${data.subscription.rejectionReason || 'No reason provided'}. Please contact support.`);
          return;
        }

        // Approved - stay on owner dashboard
        // User is already on owner dashboard, no need to redirect
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      // On error, try to go to subscription page
      router.push('/owner/subscription');
    }
  };

  // Calculate dashboard stats
  const dashboardStats = {
    totalTurfs: turfs.length,
    totalBookings: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    pendingBookings: 0,
    activeBookings: 0,
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                <div className="bg-blue-500 rounded-lg p-1.5 md:p-2 mr-2 md:mr-3">
                  <MapPin className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-blue-600">OutFyld</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Owner Dashboard</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-medium text-gray-900">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500">{user.businessName || 'Turf Owner'}</p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 hidden md:flex">
                Owner
              </Badge>
              <Link href="/">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  <MapPin className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Home</span>
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                onClick={logout}
                className="text-gray-600 text-xs"
              >
                <span className="hidden md:inline">Logout</span>
                <span className="md:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Verification Status Alert */}
        {user.verificationStatus === 'pending' && (
          <div className="mb-4 md:mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 md:mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800 text-sm md:text-base">Verification Pending</h3>
                <p className="text-xs md:text-sm text-yellow-700 mt-1">
                  Your account is awaiting admin verification. You will be able to list your turfs once approved.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {user.verificationStatus === 'rejected' && (
          <div className="mb-4 md:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-red-600 mt-0.5 mr-2 md:mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 text-sm md:text-base">Application Rejected</h3>
                <p className="text-xs md:text-sm text-red-700 mt-1">
                  Your application has been rejected. Reason: {user.rejectionReason || 'No reason provided'}
                </p>
                <p className="text-xs md:text-sm text-red-700 mt-2">
                  Please contact support for more information or to reapply.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Welcome Section */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name}!
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Manage your turf facilities and bookings from your dashboard.
            </p>
          </div>
          <Button 
            onClick={handleAddTurf}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Turf
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Turfs</CardTitle>
              <Building className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalTurfs}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.totalTurfs === 0 ? 'No turfs added yet' : 'Active facilities'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                All-time bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{dashboardStats.monthlyRevenue}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.activeBookings}</div>
              <p className="text-xs text-muted-foreground">
                Current bookings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* My Turfs Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">My Turfs</h2>
          {turfs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No turfs added yet</h3>
                <p className="text-gray-500 mb-6 text-center max-w-md">
                  Get started by adding your first turf facility. You can add multiple turfs to manage all your properties in one place.
                </p>
                <Button 
                  onClick={handleAddTurf}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Turf
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {turfs.map((turf) => (
                <Card key={turf._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-gray-200">
                    {turf.images && turf.images.length > 0 ? (
                      <img
                        src={turf.images[0].url}
                        alt={turf.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <Badge 
                      className="absolute top-2 right-2"
                      variant={turf.isActive ? "default" : "secondary"}
                    >
                      {turf.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{turf.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {turf.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="line-clamp-1">
                        {turf.location.city}, {turf.location.state}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>₹{turf.pricing}/hour</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {turf.sportsOffered.slice(0, 3).map((sport, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {sport}
                        </Badge>
                      ))}
                      {turf.sportsOffered.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{turf.sportsOffered.length - 3}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Booking Stats */}
                    {bookingStats[turf._id] && (
                      <div className="flex gap-2 pt-2 border-t mt-2">
                        <div className="flex items-center gap-1 text-xs">
                          <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-300">
                            {bookingStats[turf._id].pending} Pending
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-300">
                            {bookingStats[turf._id].confirmed} Confirmed
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => router.push(`/owner/turfs/${turf._id}/bookings`)}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Bookings
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => router.push(`/owner/turfs/${turf._id}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteTurf(turf._id)}
                        disabled={deleting === turf._id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Getting Started Guide */}
        {dashboardStats.totalTurfs === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">🚀 Getting Started</CardTitle>
              <CardDescription className="text-blue-700">
                Welcome to OutFyld! Here&apos;s how to set up your turf business:
              </CardDescription>
            </CardHeader>
            <CardContent className="text-blue-700">
              <ol className="list-decimal list-inside space-y-2">
                <li>Add your first turf facility with photos and details</li>
                <li>Set pricing and availability hours</li>
                <li>Configure booking rules and policies</li>
                <li>Start receiving bookings from customers!</li>
              </ol>
              <div className="mt-6">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Turf
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <ProtectedRoute requireRole="owner">
      <OwnerDashboard />
    </ProtectedRoute>
  );
}