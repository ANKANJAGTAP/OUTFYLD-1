'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
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
  Trophy
} from 'lucide-react';
import Link from 'next/link';

function PlayerDashboard() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  // Placeholder data - In real app, this would come from API
  const playerStats = {
    totalBookings: 12,
    favoriteSpots: 3,
    pointsEarned: 450,
    gamesPlayed: 28
  };

  const recentBookings = [
    {
      id: 1,
      turfName: 'Prime Sports Arena',
      location: 'Sangli, Maharashtra',
      date: '2025-09-25',
      time: '6:00 PM - 7:00 PM',
      status: 'completed',
      sport: 'Cricket'
    },
    {
      id: 2,
      turfName: 'Elite Cricket Ground',
      location: 'Miraj, Maharashtra',
      date: '2025-09-28',
      time: '8:00 AM - 10:00 AM',
      status: 'upcoming',
      sport: 'Cricket'
    }
  ];

  const favoriteTurfs = [
    {
      id: 1,
      name: 'Prime Sports Arena',
      location: 'Sangli, Maharashtra',
      rating: 4.6,
      price: '₹1200/hour'
    },
    {
      id: 2,
      name: 'Elite Cricket Ground', 
      location: 'Miraj, Maharashtra',
      rating: 4.4,
      price: '₹1000/hour'
    }
  ];

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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="bg-green-500 rounded-lg p-2 mr-3">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">OutFyld</h1>
                  <p className="text-xs text-gray-500">Player Dashboard</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

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
                {recentBookings.map((booking) => (
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
                        <Button size="sm" variant="outline" className="mt-2">
                          View Details
                        </Button>
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
                      <Button size="sm" variant="outline">
                        Book Now
                      </Button>
                    </div>
                  ))}
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
