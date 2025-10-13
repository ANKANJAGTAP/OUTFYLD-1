'use client';

import { useState } from 'react';
import { BrowseHeader } from '@/components/browse/BrowseHeader';
import { FilterSidebar } from '@/components/browse/FilterSidebar';
import TurfGrid from '@/components/browse/TurfGrid';
import { Footer } from '@/components/landing/Footer';

interface Turf {
  _id: string;
  name: string;
  description: string;
  businessName: string;
  featuredImage: string;
  images: Array<{
    url: string;
    public_id: string;
  }>;
  sportsOffered: string[];
  customSport?: string;
  amenities: string[];
  pricing: number;
  rating: number;
  reviewCount: number;
  location: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  availableSlots: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
  contactInfo: {
    phone: string;
    businessName: string;
  };
  owner?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BrowseData {
  turfs: Turf[];
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
    priceRange: {
      min: number;
      max: number;
    };
  };
}

export default function BrowsePage() {
  const [filters, setFilters] = useState({
    location: '',
    sport: '',
    priceRange: [0, 2000],
    rating: 0,
    amenities: []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [browseData, setBrowseData] = useState<BrowseData | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <BrowseHeader 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="grid lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          <div className="lg:col-span-1">
            <FilterSidebar 
              filters={filters}
              onFiltersChange={setFilters}
              availableCities={browseData?.filters.cities || []}
              availableSports={browseData?.filters.sports || []}
              priceRange={browseData?.filters.priceRange || { min: 0, max: 2000 }}
            />
          </div>
          
          <div className="lg:col-span-3">
            <TurfGrid 
              searchQuery={searchQuery}
              selectedSports={filters.sport ? [filters.sport] : []}
              priceRange={filters.priceRange as [number, number]}
              selectedAmenities={filters.amenities}
              selectedLocation={filters.location}
              selectedRating={filters.rating}
              sortBy={sortBy}
              availableCities={browseData?.filters.cities || []}
              availableSports={browseData?.filters.sports || []}
              onDataLoad={setBrowseData}
            />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}