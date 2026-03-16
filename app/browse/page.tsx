'use client';

import { useState, useEffect } from 'react';
import { BrowseHeader } from '@/components/browse/BrowseHeader';
import { FilterSidebar } from '@/components/browse/FilterSidebar';
import TurfGrid from '@/components/browse/TurfGrid';
import { Footer } from '@/components/landing/Footer';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';

interface BrowseData {
  turfs: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    cities: string[];
    sports: string[];
    priceRange: { min: number; max: number };
  };
}

export default function BrowsePage() {
  const [filters, setFilters] = useState({
    location: '',
    sport: '',
    priceRange: [0, 10000],
    rating: 0,
    amenities: []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [currentPage, setCurrentPage] = useState(1);
  const [browseData, setBrowseData] = useState<BrowseData | null>(null);

  const SPORT_CHIPS = ['All', 'Football', 'Cricket', 'Tennis', 'Basketball', 'Badminton', 'Volleyball'];

  // ⭐ Geolocation for "Nearest" sort
  const {
    location: userLocation,
    error: locationError,
    loading: locationLoading,
    permissionState,
    isDenied: isLocationDenied,
    requestLocation
  } = useGeolocation();

  // ⭐ When user selects "Nearest" sort, request location
  const handleSortChange = (value: string) => {
    setSortBy(value);

    if (value === 'distance' && !userLocation && !locationLoading) {
      requestLocation();
    }
  };

  // ⭐ Request location on mount if default sort is "distance"
  useEffect(() => {
    if (sortBy === 'distance' && !userLocation && !locationLoading && !locationError) {
      requestLocation();
    }
  }, [sortBy, userLocation, locationLoading, locationError, requestLocation]);

  // ⭐ If location is denied while on "distance" sort, revert
  useEffect(() => {
    if (locationError && sortBy === 'distance') {
      // Keep sort as distance but show error
      // User can manually change sort or retry
    }
  }, [locationError, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <BrowseHeader />
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        
        {/* Header Section */}
        <div className="sticky top-[72px] lg:top-[80px] z-30 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm pt-4 pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center rounded-xl px-4 md:px-6 mt-4 transition-all">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Browse Turfs</h2>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-semibold text-gray-700">{browseData?.pagination.totalItems || 0}</span> items found
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full md:w-auto items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-4 md:mt-0">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search turfs, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-full bg-white border-gray-300 pointer-events-auto"
              />
            </div>
            
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500 whitespace-nowrap">Sort by:</span>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-48 h-10 bg-white border-gray-300 font-medium text-gray-700">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Nearest</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="popularity">Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ⭐ Location status banner (only visible when "Nearest" sort is active) */}
        {sortBy === 'distance' && (
          <div className="mb-4">
            {locationLoading && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Getting your location...
              </div>
            )}
            
            {isLocationDenied && (
              <div className="flex items-center justify-between text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <span>⚠️ Location access denied. Cannot sort by nearest.</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={requestLocation} className="underline font-medium hover:text-red-900 transition-colors">
                    Retry Setup
                  </button>
                  <button onClick={() => setSortBy('newest')} className="text-gray-500 hover:text-gray-800 transition-colors" title="Clear sort">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            {userLocation && !locationLoading && !isLocationDenied && !locationError && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <MapPin className="h-4 w-4" />
                Showing turfs nearest to your location
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 relative min-h-[calc(100vh-200px)]">
          
          {/* Main Listings */}
          <div className="w-full flex-col flex">
            
            {/* Sport Filter Chips */}
            <div className="flex overflow-x-auto gap-2 mb-6 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {SPORT_CHIPS.map((sport) => {
                const isSelected = filters.sport === (sport === 'All' ? '' : sport);
                return (
                  <button
                    key={sport}
                    onClick={() => setFilters({ ...filters, sport: sport === 'All' ? '' : sport })}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                      isSelected 
                        ? 'bg-green-600 text-white shadow-md' 
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {sport}
                  </button>
                );
              })}
            </div>

            <div className="grid lg:grid-cols-4 gap-6 lg:gap-8 relative pb-10">
              <div className="lg:col-span-1 self-start sticky top-[160px] max-h-[calc(100vh-180px)] overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden pb-4">
                <FilterSidebar 
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableCities={browseData?.filters.cities || []}
                  availableSports={browseData?.filters.sports || []}
                  priceRange={browseData?.filters.priceRange || { min: 0, max: 10000 }}
                />
              </div>
              <div className="lg:col-span-3 min-w-0">
                <TurfGrid 
                  searchQuery={searchQuery}
                  selectedSports={filters.sport ? [filters.sport] : []}
                  priceRange={filters.priceRange as [number, number]}
                  selectedAmenities={filters.amenities}
                  selectedLocation={filters.location}
                  selectedRating={filters.rating}
                  sortBy={sortBy}
                  userLat={sortBy === 'distance' ? userLocation?.lat : undefined}
                  userLng={sortBy === 'distance' ? userLocation?.lng : undefined}
                  availableCities={browseData?.filters.cities || []}
                  availableSports={browseData?.filters.sports || []}
                  onDataLoad={setBrowseData}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}