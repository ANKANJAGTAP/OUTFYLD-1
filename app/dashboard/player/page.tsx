'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Calendar, 
  Clock,
  Star,
  User,
  LogOut,
  Search,
  History,
  Heart,
  Trophy,
  ChevronDown,
  Shield,
  ListOrdered,
  FileText,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function PlayerDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const [bookings, setBookings] = useState<any[]>([]);
  const [playerStats, setPlayerStats] = useState({
    totalBookings: 0,
    favoriteSpots: 0,
    pointsEarned: 0,
    gamesPlayed: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch real data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bookings/customer/${user.uid}?limit=5`);
        
        if (response.ok) {
          const data = await response.json();
          setBookings(data.bookings || []);
          
          // Calculate stats based on real data
          const completedBookings = data.bookings?.filter((b: any) => 
            b.status === 'completed' || b.paymentStatus === 'paid'
          ) || [];
          
          setPlayerStats({
            totalBookings: data.pagination?.totalItems || 0,
            favoriteSpots: 0, // No favorites feature yet
            pointsEarned: completedBookings.length * 10, // Example logic for points
            gamesPlayed: completedBookings.length
          });
        }
      } catch (error) {
        console.error('Failed to fetch player dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.uid]);

  const recentBookings = bookings.slice(0, 3).map((booking: any) => ({
    id: booking._id,
    turfId: booking.turfId?._id,
    turfName: booking.turfId?.businessName || 'Unknown Turf',
    location: booking.turfId?.location?.address || 'Location unavailable',
    date: booking.slot?.date,
    time: `${booking.slot?.startTime} - ${booking.slot?.endTime}`,
    status: booking.status === 'confirmed' && new Date(booking.slot?.date) < new Date() ? 'completed' : 
            booking.status === 'pending_payment' ? 'pending' : booking.status,
    sport: 'Sports' // Default or fetch from turf details if available
  }));

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <LandingHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name}! 🏏
          </h2>
          <p className="text-gray-600 mt-2">
            Ready to book your next game? Find and reserve the best turfs in your area.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900">{playerStats.totalBookings}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-green-600">All time bookings</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Favorite Spots</p>
                  <p className="text-3xl font-bold text-gray-900">{playerStats.favoriteSpots}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-gray-600">Saved turfs</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Points Earned</p>
                  <p className="text-3xl font-bold text-gray-900">{playerStats.pointsEarned}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-green-600">Loyalty points</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Games Played</p>
                  <p className="text-3xl font-bold text-gray-900">{playerStats.gamesPlayed}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Star className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-gray-600">Total sessions</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Recent Bookings
              </CardTitle>
              <CardDescription>Your recent and upcoming turf reservations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-gray-900">{booking.turfName}</p>
                        <Badge 
                          variant={booking.status === 'completed' ? 'default' : 'secondary'}
                          className={booking.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {booking.location}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {booking.date} • {booking.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{booking.sport}</p>
                      {booking.status === 'upcoming' && (
                        <Link href={`/book/${booking.turfId}`}>
                          <Button size="sm" variant="outline" className="mt-2">
                            View Details
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Button variant="outline" className="w-full">
                  <History className="h-4 w-4 mr-2" />
                  View All Bookings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Favorites */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Find and book your next game</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" size="lg" asChild>
                  <Link href="/browse">
                    <Search className="h-5 w-5 mr-3" />
                    Browse All Turfs
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Calendar className="h-5 w-5 mr-3" />
                  Quick Book (Cricket)
                </Button>
                
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Heart className="h-5 w-5 mr-3" />
                  View Favorites
                </Button>
                
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Trophy className="h-5 w-5 mr-3" />
                  Rewards & Points
                </Button>
              </CardContent>
            </Card>

            {/* Favorite Turfs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Favorite Turfs
                </CardTitle>
                <CardDescription>Your most loved playing spots</CardDescription>
              </CardHeader>
              <CardContent>
                {/*
                <div className="space-y-3">
                  {favoriteTurfs.map((turf) => (
                    <div key={turf.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{turf.name}</p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {turf.location}
                        </p>
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-sm font-medium">{turf.rating}</span>
                          <span className="text-sm text-gray-500 ml-2">{turf.price}</span>
                        </div>
                      </div>
                      <Link href={`/book/${turf.turfId}`}>
                        <Button size="sm" variant="outline">
                          Book Now
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
                */}
                <div className="text-center py-6 text-sm text-gray-500">
                  <Heart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p>Favorite turfs feature coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PlayerDashboardPage() {
  return (
    <ProtectedRoute requireRole="customer">
      <PlayerDashboard />
    </ProtectedRoute>
  );
}
