'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, MapPin, Clock, Star } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, firebaseUser } = useAuth();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Redirect to browse page with search query
      window.location.href = `/browse?search=${encodeURIComponent(searchQuery.trim())}`;
    } else {
      window.location.href = '/browse';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="relative py-12 md:py-16 lg:py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 opacity-10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 md:mb-6">
              Book Your
              <span className="text-green-500 block">Dream Turf</span>
              <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-600 font-normal">in Seconds</span>
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed">
              The first centralized platform for booking sports turfs in Sangli and Miraj. 
              Real-time availability, instant confirmation, and secure payments.
            </p>

            <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by location, sport, or turf name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="border-0 text-sm sm:text-base md:text-lg bg-gray-50 h-11 md:h-12"
                  />
                </div>
                <Button 
                  size="lg" 
                  onClick={handleSearch}
                  className="bg-green-500 hover:bg-green-600 px-6 md:px-8 h-11 md:h-12 w-full sm:w-auto"
                >
                  <Search className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  <span className="text-sm md:text-base">Search</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
              {firebaseUser && user ? (
                // User is logged in - show role-specific actions
                <>
                  <Link href="/browse" className="flex-1">
                    <Button size="lg" className="w-full bg-green-500 hover:bg-green-600 text-sm sm:text-base md:text-lg py-4 md:py-6">
                      Browse All Turfs
                    </Button>
                  </Link>
                  <Link href={user.role === 'owner' ? '/owner/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/dashboard/player'} className="flex-1">
                    <Button size="lg" variant="outline" className="w-full text-sm sm:text-base md:text-lg py-4 md:py-6 border-green-300 hover:bg-green-50">
                      Go to Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                // User is not logged in - show registration options
                <>
                  <Link href="/browse" className="flex-1">
                    <Button size="lg" className="w-full bg-green-500 hover:bg-green-600 text-sm sm:text-base md:text-lg py-4 md:py-6">
                      Browse All Turfs
                    </Button>
                  </Link>
                  <Link href="/auth/register" className="flex-1">
                    <Button size="lg" variant="outline" className="w-full text-sm sm:text-base md:text-lg py-4 md:py-6 border-green-300 hover:bg-green-50">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-green-500 flex-shrink-0" />
                <span>25+ Turfs</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-green-500 flex-shrink-0" />
                <span>Instant Booking</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-green-500 flex-shrink-0" />
                <span>4.8/5 Rating</span>
              </div>
            </div>
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <div className="text-3xl font-bold text-green-500 mb-2">500+</div>
                <div className="text-gray-600">Happy Players</div>
              </Card>
              <Card className="p-6 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <div className="text-3xl font-bold text-blue-500 mb-2">25+</div>
                <div className="text-gray-600">Registered Turfs</div>
              </Card>
              <Card className="p-6 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <div className="text-3xl font-bold text-purple-500 mb-2">1000+</div>
                <div className="text-gray-600">Bookings Made</div>
              </Card>
              <Card className="p-6 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <div className="text-3xl font-bold text-orange-500 mb-2">4.8/5</div>
                <div className="text-gray-600">Average Rating</div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}