"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { FilterSidebar } from "@/components/browse/FilterSidebar";
import TurfGrid from "@/components/browse/TurfGrid";
import { NightFooter } from '@/components/landing/night-match/NightFooter';
import { NightShell } from "@/components/night/NightShell";
import { NightDrawer } from "@/components/night/NightDrawer";
import { SquadSelector } from "@/components/night/SquadSelector";
import { OdometerText } from "@/components/night/OdometerText";
import { PitchDivider } from "@/components/landing/night-match/PitchDivider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Loader2,
  X,
  SlidersHorizontal,
  ArrowUpDown,
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

// useSearchParams requires a Suspense boundary in the App Router
export default function BrowsePage() {
  return (
    <Suspense fallback={null}>
      <BrowsePageInner />
    </Suspense>
  );
}

function BrowsePageInner() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => {
    // Deep-links from the homepage kit rack: /browse?sport=Cricket
    const requested = (searchParams.get("sport") || "").toLowerCase();
    const chips = ["Football", "Cricket", "Tennis", "Basketball", "Badminton", "Volleyball"];
    const sport = chips.find((c) => c.toLowerCase() === requested) || "";
    return {
      location: "",
      sport,
      priceRange: [0, 10000],
      rating: 0,
      amenities: [],
    };
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [browseData, setBrowseData] = useState<BrowseData | null>(null);
  // Mobile-only filter drawer (desktop keeps the sticky sidebar)
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  // Auto-switch to "distance" sort only if location is already granted
  useEffect(() => {
    if (permissionState === "granted" && userLocation) {
      setSortBy("distance");
    }
  }, [permissionState, userLocation]);

  // If location is denied/errored while on "distance" sort, fallback to "newest"
  useEffect(() => {
    if ((isLocationDenied || locationError) && sortBy === "distance") {
      setSortBy("newest");
    }
  }, [isLocationDenied, locationError, sortBy]);

  // Count active filters for the badge
  const activeFilterCount = [
    filters.location,
    filters.sport,
    filters.rating > 0,
    filters.amenities.length > 0,
    filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000,
  ].filter(Boolean).length;

  const resetAll = () => {
    setFilters({ location: "", sport: "", priceRange: [0, 10000], rating: 0, amenities: [] });
    setSearchQuery("");
  };

  const liveCount = browseData?.pagination.totalItems || 0;

  return (
    <NightShell>
      <LandingHeader />

      {/* ─────────── FIXTURE LIST HEADER ─────────── */}
      <div className="mx-auto max-w-[1600px] px-4 pb-2 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <p className="nm-overline mb-4 flex items-center gap-2.5 text-chalk-400">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-flood-500 shadow-flood" />
          <span className="text-flood-500">
            <OdometerText value={liveCount} /> turfs live
          </span>
          · Tonight&apos;s listings
        </p>
        <h1 className="nm-display-xl text-chalk-100">Find your pitch</h1>
      </div>

      <PitchDivider flag="right" />

      <div className="relative mx-auto max-w-[1600px] px-4 pb-16 sm:px-6 lg:px-8">
        {/* ── Sticky Search + Sort Bar ── */}
        <div className="sticky top-[64px] z-30 mb-6 rounded-[4px] border border-pitchline bg-pitch-800/90 px-4 py-4 backdrop-blur-md sm:px-6 lg:top-[72px]">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400/60" />
              <input
                placeholder="Search arenas, locations…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-[4px] border border-pitchline bg-pitch-900/60 pl-10 pr-9 text-sm text-chalk-100 outline-none transition-[border-color] duration-200 ease-night placeholder:text-chalk-400/50 focus:border-flood-500/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-chalk-400/60 transition-colors hover:text-chalk-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort (+ mobile Filters trigger) */}
            <div className="flex w-full items-center gap-3 md:w-auto">
              {/* Mobile-only: open the filter drawer */}
              <button
                onClick={() => setFiltersOpen(true)}
                className="flex h-11 shrink-0 items-center gap-2 rounded-[4px] border border-pitchline bg-pitch-900/60 px-4 font-mono text-xs uppercase tracking-[0.12em] text-chalk-100 transition-colors duration-200 ease-night hover:border-flood-500/60 lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 text-flood-500" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-[3px] border border-flood-500/40 px-1.5 text-[10px] leading-4 text-flood-500">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400 sm:flex">
                <ArrowUpDown className="h-3.5 w-3.5 text-flood-500" />
                Sort
              </span>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="h-11 w-full rounded-[4px] border-pitchline bg-pitch-900/60 font-mono text-xs uppercase tracking-[0.12em] text-chalk-100 sm:w-52">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px] border-pitchline font-mono text-xs uppercase tracking-[0.1em]">
                  <SelectItem value="distance">Nearest</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="popularity">Popular</SelectItem>
                  <SelectItem value="rating">Highest rated</SelectItem>
                  <SelectItem value="price-low">Price: low → high</SelectItem>
                  <SelectItem value="price-high">Price: high → low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── Location Status ── */}
        {sortBy === "distance" && (
          <div className="mb-5">
            {locationLoading && (
              <div className="flex items-center gap-3 rounded-[4px] border border-pitchline bg-pitch-700/80 px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-flood-500" />
                <div>
                  <p className="text-sm text-chalk-100">Getting your location…</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
                    Shows turfs nearest to you
                  </p>
                </div>
              </div>
            )}

            {isLocationDenied && (
              <div className="flex items-center justify-between rounded-[4px] border border-red-900/60 bg-pitch-700/80 px-4 py-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <div>
                    <p className="text-sm text-chalk-100">Location access denied</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
                      Enable location to sort by nearest
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={requestLocation}
                    className="rounded-[4px] border border-chalk-400/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-100 transition-colors duration-200 ease-night hover:border-flood-500 hover:text-flood-500"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => setSortBy("newest")}
                    className="p-1 text-chalk-400/60 transition-colors hover:text-chalk-100"
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {userLocation && !locationLoading && !isLocationDenied && !locationError && (
              <div className="flex items-center gap-3 rounded-[4px] border border-pitchline bg-pitch-700/80 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-flood-500" />
                <div>
                  <p className="text-sm text-chalk-100">Showing arenas nearest to you</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
                    Sorted by distance
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SQUAD SELECTOR — sport tabs with sliding lime underline ── */}
        <SquadSelector
          className="mb-8"
          options={SPORT_CHIPS.map((s) => ({ label: s, value: s === "All" ? "" : s }))}
          value={filters.sport}
          onChange={(v) => setFilters({ ...filters, sport: v })}
        />

        {/* ── Grid Layout: Sidebar + Turfs ── */}
        <div className="relative grid min-h-[calc(100vh-200px)] gap-6 lg:grid-cols-4 lg:gap-8">
          {/* Sidebar — desktop only; mobile uses the NightDrawer below */}
          <div className="sticky top-[150px] hidden max-h-[calc(100vh-170px)] self-start overflow-y-auto pb-4 lg:col-span-1 lg:block [&::-webkit-scrollbar]:hidden">
            <div className="overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/80">
              <div className="flex items-center justify-between border-b border-pitchline/60 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="h-4 w-4 text-flood-500" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-100">
                    Filters
                  </span>
                </div>
                {activeFilterCount > 0 && (
                  <span className="rounded-[3px] border border-flood-500/40 px-1.5 font-mono text-[10px] leading-5 text-flood-500">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <div className="p-4">
                <FilterSidebar
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableCities={browseData?.filters.cities || []}
                  availableSports={browseData?.filters.sports || []}
                  priceRange={browseData?.filters.priceRange || { min: 0, max: 10000 }}
                />
              </div>
            </div>
          </div>

          {/* Turf Grid */}
          <div className="min-w-0 pb-10 lg:col-span-3">
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
              onReset={resetAll}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      <NightDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        subtitle="Dial it in"
        title="Filters"
        footer={
          <div className="flex items-center gap-3">
            <button
              onClick={resetAll}
              className="flex h-12 items-center justify-center gap-2 rounded-[4px] border border-chalk-400/30 px-5 font-mono text-xs uppercase tracking-[0.14em] text-chalk-100 transition-colors duration-200 ease-night hover:border-flood-500 hover:text-flood-500"
            >
              <X className="h-4 w-4" />
              Reset
            </button>
            <button
              onClick={() => setFiltersOpen(false)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[4px] bg-flood-500 px-5 font-mono text-xs uppercase tracking-[0.14em] text-pitch-900 transition-[transform,background-color] duration-200 ease-night hover:bg-flood-600 active:translate-y-[2px]"
            >
              Show <OdometerText value={liveCount} /> {liveCount === 1 ? "result" : "results"}
            </button>
          </div>
        }
      >
        <FilterSidebar
          filters={filters}
          onFiltersChange={setFilters}
          availableCities={browseData?.filters.cities || []}
          availableSports={browseData?.filters.sports || []}
          priceRange={browseData?.filters.priceRange || { min: 0, max: 10000 }}
        />
      </NightDrawer>

      <NightFooter />
    </NightShell>
  );
}
