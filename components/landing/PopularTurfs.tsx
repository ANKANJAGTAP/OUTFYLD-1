'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StarRating } from '@/components/ui/star-rating';

interface Turf {
  _id: string;
  name: string;
  location: string;
  sports: string[];
  rating: number;
  reviewCount: number;
  pricePerHour: number;
  images: string[];
  amenities: string[];
}

export function PopularTurfs() {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTurfs();
  }, []);

  const fetchTurfs = async () => {
    try {
      const response = await fetch('/api/turfs');
      const data = await response.json();
      
      if (data.success) {
        // Get top 3 rated turfs for popular section
        const topTurfs = data.turfs
          .sort((a: Turf, b: Turf) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 3);
        setTurfs(topTurfs);
      }
    } catch (error) {
      console.error('Error fetching turfs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Popular Turfs in Your Area
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the most loved sports facilities, rated by our community of players.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (turfs.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Popular Turfs in Your Area
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              No turfs available at the moment. Check back soon!
            </p>
            <Link href="/browse">
              <Button size="lg" className="bg-green-500 hover:bg-green-600">
                Browse All Turfs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-gray-900 mb-4">
            Popular Turfs in Your Area
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the most loved sports facilities in Sangli and Miraj, 
            rated by our community of players.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {turfs.map((turf) => (
            <Card 
              key={turf._id} 
              className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white border-0"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={turf.images && turf.images.length > 0 ? turf.images[0] : 'https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'} 
                  alt={turf.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-500 text-white px-3 py-1">
                    Available
                  </Badge>
                </div>
                <div className="absolute bottom-4 left-4 text-white drop-shadow-lg">
                  <div className="text-2xl font-bold">₹{turf.pricePerHour}/hour</div>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="mb-4">
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    {turf.name}
                  </h4>
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{turf.location}</span>
                  </div>
                  
                  <div className="mb-3">
                    <StarRating 
                      rating={turf.rating || 0} 
                      reviewCount={turf.reviewCount || 0}
                      size="sm"
                      showCount={true}
                    />
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {turf.sports && turf.sports.length > 0 ? (
                        turf.sports.map((sport, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {sport}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Sports
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {turf.amenities && turf.amenities.length > 0 
                        ? turf.amenities.slice(0, 3).join(' • ') 
                        : 'Amenities available'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/book/${turf._id}`} className="flex-1">
                    <Button className="w-full bg-green-500 hover:bg-green-600">
                      Book Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/browse">
            <Button size="lg" variant="outline" className="border-green-300 text-green-600 hover:bg-green-50 px-8">
              View All Turfs
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}