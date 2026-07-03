'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { StarRating } from '@/components/ui/star-rating';
import { NightSkeleton } from '@/components/night/ui';
import { OdometerText } from '@/components/night/OdometerText';
import { MapPin, ArrowUpRight } from 'lucide-react';

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
  userLat?: number;
  userLng?: number;
  availableCities?: string[];
  availableSports?: string[];
  onDataLoad?: (data: any) => void;
  onReset?: () => void;
}

import TurfCardCarousel from '@/components/browse/TurfCardCarousel';

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
  onDataLoad,
  onReset,
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

    if (sortBy === 'distance' && userLat !== undefined && userLng !== undefined) {
      params.append('lat', userLat.toString());
      params.append('lng', userLng.toString());
    }

    return params.toString();
  }, [searchQuery, selectedSports, priceRange, selectedAmenities, selectedLocation, selectedRating, sortBy, userLat, userLng]);

  const fetchTurfs = useCallback(async () => {
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
        cache: 'no-store',
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

  const getDisplayLocation = useCallback((turf: TurfData) => {
    if (turf.location?.city) {
      return `${turf.location.city}${turf.location.state ? `, ${turf.location.state}` : ''}`;
    }
    return 'Location not specified';
  }, []);

  const getDisplayName = useCallback((turf: TurfData) => {
    return turf.businessName || turf.name || 'Unnamed Turf';
  }, []);

  // ── skeleton: dim lime scanline shimmer ──
  if (loading) {
    return (
      <div className="space-y-6">
        <NightSkeleton className="h-4 w-40" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 lg:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/60">
              <NightSkeleton className="h-44 w-full rounded-none" />
              <div className="space-y-3 p-5">
                <NightSkeleton className="h-6 w-3/4" />
                <NightSkeleton className="h-3.5 w-1/3" />
                <NightSkeleton className="h-3.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sortBy === 'distance' && userLat === undefined && userLng === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-[4px] border border-pitchline bg-pitch-700/40">
        <div className="space-y-3 px-6 text-center">
          <MapPin className="mx-auto h-8 w-8 text-flood-500/70" />
          <p className="text-sm text-chalk-100">Waiting for location access to show nearest arenas…</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-400">
            Allow location access in your browser
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-[4px] border border-red-900/60 bg-red-950/20 px-5 py-4 text-sm text-red-200">
        {error}
      </div>
    );
  }

  // ── empty state: dark pitch, "NO MATCHES TONIGHT" ──
  if (turfs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[4px] border border-pitchline bg-pitch-700/40 px-6 py-20 text-center">
        {/* minimal pitch line-drawing */}
        <svg viewBox="0 0 120 76" className="mb-8 h-24 w-40 opacity-70" aria-hidden>
          <rect x="2" y="2" width="116" height="72" fill="none" stroke="#1F2D26" strokeWidth="2" />
          <line x1="60" y1="2" x2="60" y2="74" stroke="#1F2D26" strokeWidth="2" />
          <circle cx="60" cy="38" r="12" fill="none" stroke="#1F2D26" strokeWidth="2" />
          <rect x="2" y="24" width="14" height="28" fill="none" stroke="#1F2D26" strokeWidth="2" />
          <rect x="104" y="24" width="14" height="28" fill="none" stroke="#1F2D26" strokeWidth="2" />
          <circle cx="60" cy="38" r="1.8" fill="#C8F135" />
        </svg>
        <h3 className="font-display text-3xl uppercase tracking-tight text-chalk-100 sm:text-4xl">
          No matches tonight
        </h3>
        <p className="mt-3 max-w-sm text-sm text-chalk-400">
          {sortBy === 'distance'
            ? 'No turfs with location data found. Try a different sort option.'
            : 'Nothing fits those filters. Loosen them up and try again.'}
        </p>
        {onReset && (
          <button
            onClick={onReset}
            className="nm-overline mt-8 rounded-[4px] border border-chalk-400/30 px-6 py-3 text-chalk-100 transition-colors duration-200 ease-night hover:border-flood-500 hover:text-flood-500"
          >
            Reset filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-400">
        Showing <OdometerText value={turfs.length} className="text-chalk-100" />{' '}
        {turfs.length === 1 ? 'turf' : 'turfs'}
        {sortBy === 'distance' && <span className="text-chalk-400/70">· by distance</span>}
      </div>

      {/* key on the query re-deals the grid with a 30ms stagger when filters change */}
      <div
        key={searchParams}
        className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 lg:gap-8"
      >
        {turfs.map((turf, i) => {
          const hasOffer = !!(turf.discountPercent && turf.discountPercent > 0 && turf.offerPrice);
          const price = hasOffer ? turf.offerPrice : turf.pricing;
          return (
            <Link
              key={turf._id}
              href={`/book/${turf._id}`}
              className="nm-deal group flex h-full flex-col overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/90 transition-[border-color,box-shadow,transform] duration-300 ease-night hover:-translate-y-1 hover:border-flood-500/50 hover:shadow-flood"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {/* fixture image — night-lit treatment, relights on hover */}
              <div className="relative h-44 w-full overflow-hidden bg-pitch-800 [&_img]:brightness-[0.82] [&_img]:contrast-105 [&_img]:saturate-[0.85] group-hover:[&_img]:brightness-[0.95]">
                <TurfCardCarousel
                  images={turf.images || []}
                  featuredImage={turf.featuredImage}
                  alt={getDisplayName(turf)}
                />
                {/* floodlight vignette that lifts on hover */}
                <div
                  className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300 ease-night group-hover:opacity-40"
                  style={{
                    background:
                      'radial-gradient(130% 105% at 50% 0%, transparent 42%, rgba(4,6,5,0.6) 100%)',
                  }}
                />
                {/* discount — lime corner-flag tab */}
                {hasOffer && (
                  <div className="absolute left-0 top-3 z-20 bg-flood-500 py-1 pl-3 pr-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-pitch-900 [clip-path:polygon(0_0,100%_0,calc(100%-8px)_50%,100%_100%,0_100%)]">
                    {turf.offerLabel || `${turf.discountPercent}% off`}
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                {/* sport overline + distance tick */}
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400">
                    {(turf.sportsOffered || []).slice(0, 2).join(' · ') || 'Multi-sport'}
                  </span>
                  {turf.distanceDisplay && (
                    <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
                      <span
                        className="inline-block h-1.5 w-1.5 bg-flood-500"
                        style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
                      />
                      {turf.distanceDisplay}
                    </span>
                  )}
                </div>

                {/* name — condensed caps */}
                <h3 className="line-clamp-1 font-display text-2xl uppercase leading-none tracking-tight text-chalk-100 transition-colors duration-200 group-hover:text-flood-500">
                  {getDisplayName(turf)}
                </h3>

                <div className="mt-2.5 flex items-center gap-2 text-chalk-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-1 text-xs">{getDisplayLocation(turf)}</span>
                </div>

                <div className="mt-3">
                  <StarRating
                    rating={turf.rating || 0}
                    reviewCount={turf.reviewCount || 0}
                    size="sm"
                    showCount={true}
                  />
                </div>

                {/* price — scoreboard digits; BOOK cue */}
                <div className="mt-auto flex items-end justify-between border-t border-pitchline/70 pt-4">
                  <div>
                    {price && price > 0 ? (
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xl tracking-tight text-chalk-100">
                          ₹{price.toLocaleString('en-IN')}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
                          /hr
                        </span>
                        {hasOffer && (
                          <span className="font-mono text-[11px] text-chalk-400/70 line-through">
                            ₹{turf.pricing.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-chalk-400">
                        Price on request
                      </span>
                    )}
                  </div>
                  <span className="nm-overline flex items-center gap-1 text-flood-500">
                    Book
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 ease-night group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
