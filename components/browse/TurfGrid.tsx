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
  images?: Array<{
    url: string;
    public_id: string;
  }>;
  sportsOffered: string[];
  customSport?: string;
  amenities: string[];
  pricing: number;
  rating?: number;
  reviewCount?: number;
  location: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  availableSlots?: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
  contactInfo?: {
    phone: string;
    businessName: string;
  };
  owner?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface TurfGridProps {
  searchQuery?: string;
  selectedSports?: string[];
  priceRange?: [number, number];
  selectedAmenities?: string[];
  selectedLocation?: string;
  selectedRating?: number;
  sortBy?: string;
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
  availableCities = [],
  availableSports = [],
  onDataLoad 
}: TurfGridProps) {
  const [turfs, setTurfs] = useState<TurfData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Memoize search parameters to prevent unnecessary re-renders
  const searchParams = useMemo(() => {
    const params = new URLSearchParams({
      page: '1',
      limit: '12',
    });

    if (searchQuery && searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }

    if (selectedSports && selectedSports.length > 0) {
      params.append('sports', selectedSports.join(','));
    }

    if (priceRange && priceRange.length === 2) {
      params.append('minPrice', priceRange[0].toString());
      params.append('maxPrice', priceRange[1].toString());
    }

    if (selectedAmenities && selectedAmenities.length > 0) {
      params.append('amenities', selectedAmenities.join(','));
    }

    if (selectedLocation && selectedLocation.trim()) {
      params.append('city', selectedLocation.trim());
    }

    if (selectedRating && selectedRating > 0) {
      params.append('minRating', selectedRating.toString());
    }

    if (sortBy) {
      params.append('sortBy', sortBy);
    }

    return params.toString();
  }, [searchQuery, selectedSports, priceRange, selectedAmenities, selectedLocation, selectedRating, sortBy]);

  const fetchTurfs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/turfs?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch turfs: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.turfs && Array.isArray(data.turfs)) {
        setTurfs(data.turfs);
        
        // Only call onDataLoad once on initial load and if it exists
        if (onDataLoad && !hasInitialLoad) {
          onDataLoad(data);
          setHasInitialLoad(true);
        }
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
  }, [searchParams, onDataLoad, hasInitialLoad]);

  // Fetch turfs when search parameters change
  useEffect(() => {
    fetchTurfs();
  }, [fetchTurfs]);

  const handleBookNow = useCallback((turfId: string) => {
    window.location.href = `/book/${turfId}`;
  }, []);

  const getImageUrl = useCallback((turf: TurfData) => {
    if (turf.featuredImage) {
      return turf.featuredImage;
    }
    if (turf.images && turf.images.length > 0) {
      return turf.images[0].url;
    }
    return 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=300&fit=crop';
  }, []);

  const formatPrice = useCallback((price?: number) => {
    if (!price || price <= 0) return 'Price on request';
    return `₹${price}/hour`;
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

  if (error) {
    return (
      <Alert className="max-w-2xl mx-auto">
        <AlertDescription>
          {error}
        </AlertDescription>
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
            Try adjusting your search criteria or browse all available turfs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600">
        Showing {turfs.length} turfs
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
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-white/90 text-black">
                    {formatPrice(turf.pricing)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4">
              <CardTitle className="text-lg mb-2 truncate">
                {getDisplayName(turf)}
              </CardTitle>
              
              <div className="space-y-2 text-sm text-gray-600">
                {/* Star Rating */}
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
                      <Badge key={index} variant="outline" className="text-xs">
                        {sport}
                      </Badge>
                    ))}
                    {turf.sportsOffered.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{turf.sportsOffered.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                
                {turf.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {turf.description}
                  </p>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="p-4 pt-0">
              <Button 
                onClick={() => handleBookNow(turf._id)}
                className="w-full"
                size="sm"
              >
                Book Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}