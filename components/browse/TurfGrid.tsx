'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StarRating } from '@/components/ui/star-rating';
import { MapPin, Users, Loader2 } from 'lucide-react';

interface TurfData {
  _id: string;
  name: string;
  description: string;
  businessName: string;
  featuredImage?: string;
  images?: Array<{ url: string; public_id: string }>;
  sportsOffered: string[];
  customSport?: string;
  amenities: string[];
  pricing: number;
  offerPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  offerLabel?: string;
  rating?: number;
  reviewCount?: number;
  location: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  availableSlots?: Array<{ day: string; startTime: string; endTime: string }>;
  contactInfo?: { phone: string; businessName: string };
  owner?: { _id: string; name: string; email: string };
  createdAt?: string;
  updatedAt?: string;
  // ⭐ Distance fields (present only when sorted by distance)
  distance?: number;
  distanceInKm?: number;
  distanceDisplay?: string;
}

interface TurfGridProps {
  searchQuery?: string;
  selectedSports?: string[];
  priceRange?: [number, number];
  selectedAmenities?: string[];
  selectedLocation?: string;
  selectedRating?: number;
  sortBy?: string;
  // ⭐ User location for distance sort
  userLat?: number;
  userLng?: number;
  availableCities?: string[];
  availableSports?: string[];
  onDataLoad?: (data: any) => void;
}

export default function TurfGrid({ 
  searchQuery = '', 
  selectedSports = [], 
  priceRange,
  selectedAmenities = [],
  selectedLocation = '',
  selectedRating = 0,
  sortBy = 'newest',
  userLat,
  userLng,
  availableCities = [],
  availableSports = [],
  onDataLoad 
}: TurfGridProps) {
  const [turfs, setTurfs] = useState<TurfData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams({
      page: '1',
      limit: '12',
    });

    if (searchQuery && searchQuery.trim()) params.append('search', searchQuery.trim());
    if (selectedSports && selectedSports.length > 0) params.append('sports', selectedSports.join(','));
    if (priceRange && priceRange.length === 2) {
      params.append('minPrice', priceRange[0].toString());
      params.append('maxPrice', priceRange[1].toString());
    }
    if (selectedAmenities && selectedAmenities.length > 0) params.append('amenities', selectedAmenities.join(','));
    if (selectedLocation && selectedLocation.trim()) params.append('city', selectedLocation.trim());
    if (selectedRating && selectedRating > 0) params.append('minRating', selectedRating.toString());
    if (sortBy) params.append('sortBy', sortBy);

    // ⭐ Include lat/lng when sorting by distance
    if (sortBy === 'distance' && userLat !== undefined && userLng !== undefined) {
      params.append('lat', userLat.toString());
      params.append('lng', userLng.toString());
    }

    return params.toString();
  }, [searchQuery, selectedSports, priceRange, selectedAmenities, selectedLocation, selectedRating, sortBy, userLat, userLng]);

  const fetchTurfs = useCallback(async () => {
    // ⭐ If sorting by distance but no location yet, don't fetch
    if (sortBy === 'distance' && (userLat === undefined || userLng === undefined)) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/turfs?${searchParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`Failed to fetch turfs: ${response.status}`);

      const data = await response.json();
      
      if (data && data.turfs && Array.isArray(data.turfs)) {
        setTurfs(data.turfs);
        if (onDataLoad) onDataLoad(data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching turfs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load turfs');
      setTurfs([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams, onDataLoad, sortBy, userLat, userLng]);

  useEffect(() => {
    fetchTurfs();
  }, [fetchTurfs]);

  const handleBookNow = useCallback((turfId: string) => {
    window.location.href = `/book/${turfId}`;
  }, []);

  const getImageUrl = useCallback((turf: TurfData) => {
    if (turf.featuredImage) return turf.featuredImage;
    if (turf.images && turf.images.length > 0) return turf.images[0].url;
    return 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=300&fit=crop';
  }, []);

  const formatPrice = useCallback((turf: TurfData) => {
    const price = turf.pricing;
    if (!price || price <= 0) return { display: 'Price on request', hasOffer: false };
    
    if (turf.discountPercent && turf.discountPercent > 0 && turf.offerPrice) {
      return {
        display: `₹${turf.offerPrice}/hr`,
        original: `₹${price}/hr`,
        hasOffer: true,
        offerLabel: turf.offerLabel || `${turf.discountPercent}% OFF`,
      };
    }
    return { display: `₹${price}/hr`, hasOffer: false };
  }, []);

  const getDisplayLocation = useCallback((turf: TurfData) => {
    if (turf.location?.city) {
      return `${turf.location.city}${turf.location.state ? `, ${turf.location.state}` : ''}`;
    }
    return 'Location not specified';
  }, []);

  const getDisplayName = useCallback((turf: TurfData) => {
    return turf.businessName || turf.name || 'Unnamed Turf';
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading turfs...</span>
        </div>
      </div>
    );
  }

  // ⭐ Waiting for location (distance sort selected but location not available yet)
  if (sortBy === 'distance' && userLat === undefined && userLng === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <MapPin className="h-10 w-10 text-gray-400 mx-auto" />
          <p className="text-gray-600">Waiting for location access to show nearest turfs...</p>
          <p className="text-sm text-gray-400">Please allow location access in your browser</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="max-w-2xl mx-auto">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (turfs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No turfs found</h3>
          <p className="text-gray-500">
            {sortBy === 'distance'
              ? 'No turfs with location data found. Try a different sort option.'
              : 'Try adjusting your search criteria or browse all available turfs.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600">
        Showing {turfs.length} turfs
        {sortBy === 'distance' && ' · Sorted by distance'}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {turfs.map((turf) => (
          <Card key={turf._id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="p-0">
              <div className="relative h-48 bg-gray-200">
                <img
                  src={getImageUrl(turf)}
                  alt={getDisplayName(turf)}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=300&fit=crop';
                  }}
                />
                {/* Price badge — top right */}
                <div className="absolute top-2 right-2">
                  {(() => {
                    const priceInfo = formatPrice(turf);
                    if (priceInfo.hasOffer) {
                      return (
                        <div className="flex flex-col items-end gap-1">
                          <Badge className="bg-green-500/95 text-white text-xs font-bold">
                            {priceInfo.offerLabel}
                          </Badge>
                          <Badge variant="secondary" className="bg-white/90 text-black">
                            <span className="line-through text-gray-400 mr-1 text-xs">{priceInfo.original}</span>
                            <span className="text-green-600 font-bold">{priceInfo.display}</span>
                          </Badge>
                        </div>
                      );
                    }
                    return (
                      <Badge variant="secondary" className="bg-white/90 text-black">
                        {priceInfo.display}
                      </Badge>
                    );
                  })()}
                </div>
                {/* ⭐ Distance badge — top left (only when sorting by distance) */}
                {turf.distanceDisplay && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-blue-600/90 text-white text-xs font-medium">
                      📍 {turf.distanceDisplay}
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-4">
              <CardTitle className="text-lg mb-2 truncate">
                {getDisplayName(turf)}
              </CardTitle>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="mb-2">
                  <StarRating 
                    rating={turf.rating || 0} 
                    reviewCount={turf.reviewCount || 0}
                    size="sm"
                    showCount={true}
                  />
                </div>

                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{getDisplayLocation(turf)}</span>
                </div>
                
                {turf.sportsOffered && turf.sportsOffered.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {turf.sportsOffered.slice(0, 3).map((sport, index) => (
                      <Badge key={index} variant="outline" className="text-xs">{sport}</Badge>
                    ))}
                    {turf.sportsOffered.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{turf.sportsOffered.length - 3} more</Badge>
                    )}
                  </div>
                )}
                
                {turf.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{turf.description}</p>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="p-4 pt-0">
              <Button onClick={() => handleBookNow(turf._id)} className="w-full" size="sm">
                Book Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}