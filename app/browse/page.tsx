"use client";

import { useState, useEffect } from "react";
import { BrowseHeader } from "@/components/browse/BrowseHeader";
import { FilterSidebar } from "@/components/browse/FilterSidebar";
import TurfGrid from "@/components/browse/TurfGrid";
import { Footer } from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Loader2,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Compass,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";

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

interface Filters {
  location: string;
  sport: string;
  priceRange: number[];
  rating: number;
  amenities: string[];
}

export default function BrowsePage() {
  const [filters, setFilters] = useState<Filters>({
    location: "",
    sport: "",
    priceRange: [0, 10000],
    rating: 0,
    amenities: [],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("distance");
  const [currentPage, setCurrentPage] = useState(1);
  const [browseData, setBrowseData] = useState<BrowseData | null>(null);

  const SPORT_CHIPS = [
    "All",
    "Football",
    "Cricket",
    "Tennis",
    "Basketball",
    "Badminton",
    "Volleyball",
  ];

  const {
    location: userLocation,
    error: locationError,
    loading: locationLoading,
    permissionState,
    isDenied: isLocationDenied,
    requestLocation,
  } = useGeolocation();

  const handleSortChange = (value: string) => {
    setSortBy(value);
    if (value === "distance" && !userLocation && !locationLoading) {
      requestLocation();
    }
  };

  useEffect(() => {
    if (
      sortBy === "distance" &&
      !userLocation &&
      !locationLoading &&
      !locationError
    ) {
      requestLocation();
    }
  }, [sortBy, userLocation, locationLoading, locationError, requestLocation]);

  useEffect(() => {
    if (locationError && sortBy === "distance") {
      // Keep sort as distance but show error
    }
  }, [locationError, sortBy]);

  // Count active filters for the badge
  const activeFilterCount = [
    filters.location,
    filters.sport,
    filters.rating > 0,
    filters.amenities.length > 0,
    filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <BrowseHeader />

      {/* ─────────── HERO STRIP ─────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />

        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 text-[10px] mb-3">
                <Compass className="h-3 w-3 mr-1" />
                Discover Arenas
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Browse Arenas
              </h1>
              <p className="text-emerald-200 text-sm mt-1">
                <span className="text-white font-semibold">
                  {browseData?.pagination.totalItems || 0}
                </span>{" "}
                arenas available near you
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────── MAIN CONTENT ─────────── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 pb-12">
        {/* ── Sticky Search + Sort Bar ── */}
        <div className="sticky top-[72px] lg:top-[80px] z-30 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 px-4 sm:px-6 py-4 mb-6 transition-all">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search arenas, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 w-full rounded-xl border-gray-200 bg-gray-50/50 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <ArrowUpDown className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:block">
                  Sort
                </span>
              </div>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-52 h-11 rounded-xl bg-gray-50/50 border-gray-200 font-medium text-gray-700 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="distance">📍 Nearest</SelectItem>
                  <SelectItem value="newest">🆕 Newest</SelectItem>
                  <SelectItem value="popularity">🔥 Popular</SelectItem>
                  <SelectItem value="rating">⭐ Highest Rated</SelectItem>
                  <SelectItem value="price-low">
                    💰 Price: Low → High
                  </SelectItem>
                  <SelectItem value="price-high">
                    💎 Price: High → Low
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── Location Status Banner ── */}
        {sortBy === "distance" && (
          <div className="mb-5">
            {locationLoading && (
              <div className="flex items-center gap-3 bg-white rounded-xl border border-emerald-100 shadow-sm px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Getting your location...
                  </p>
                  <p className="text-[11px] text-gray-400">
                    This helps show turfs nearest to you
                  </p>
                </div>
              </div>
            )}

            {isLocationDenied && (
              <div className="flex items-center justify-between bg-white rounded-xl border border-red-100 shadow-sm px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Location access denied
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Enable location to sort by nearest arenas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={requestLocation}
                    size="sm"
                    variant="outline"
                    className="rounded-lg h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Retry
                  </Button>
                  <button
                    onClick={() => setSortBy("newest")}
                    className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {userLocation &&
              !locationLoading &&
              !isLocationDenied &&
              !locationError && (
                <div className="flex items-center gap-3 bg-white rounded-xl border border-emerald-100 shadow-sm px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Showing arenas nearest to your location
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Results are sorted by distance from you
                    </p>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* ── Sport Filter Chips ── */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {SPORT_CHIPS.map((sport) => {
            const isSelected = filters.sport === (sport === "All" ? "" : sport);
            return (
              <button
                key={sport}
                onClick={() =>
                  setFilters({
                    ...filters,
                    sport: sport === "All" ? "" : sport,
                  })
                }
                className={`px-4 py-2.5 rounded-xl whitespace-nowrap text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                    : "bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-100 hover:border-emerald-200"
                }`}
              >
                {sport}
              </button>
            );
          })}
        </div>

        {/* ── Grid Layout: Sidebar + Turfs ── */}
        <div className="grid lg:grid-cols-4 gap-6 lg:gap-8 relative min-h-[calc(100vh-200px)]">
          {/* Sidebar */}
          <div className="lg:col-span-1 self-start sticky top-[160px] max-h-[calc(100vh-180px)] overflow-y-auto [&::-webkit-scrollbar]:hidden pb-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Filters
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Refine your search
                    </p>
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] h-5">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
              <div className="p-4">
                <FilterSidebar
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableCities={browseData?.filters.cities || []}
                  availableSports={browseData?.filters.sports || []}
                  priceRange={
                    browseData?.filters.priceRange || { min: 0, max: 10000 }
                  }
                />
              </div>
            </div>
          </div>

          {/* Turf Grid */}
          <div className="lg:col-span-3 min-w-0 pb-10">
            <TurfGrid
              searchQuery={searchQuery}
              selectedSports={filters.sport ? [filters.sport] : []}
              priceRange={filters.priceRange as [number, number]}
              selectedAmenities={filters.amenities}
              selectedLocation={filters.location}
              selectedRating={filters.rating}
              sortBy={sortBy}
              userLat={sortBy === "distance" ? userLocation?.lat : undefined}
              userLng={sortBy === "distance" ? userLocation?.lng : undefined}
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
