'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Play, Info, MapPin, Search, Star, Loader2 } from 'lucide-react';

interface Turf {
  _id: string;
  name: string;
  description: string;
  featuredImage: string;
  bannerImage?: string;
  images: any[];
  distanceDisplay?: string;
  sportsOffered?: string[];
  rating?: number;
}

interface HeroBannerProps {
  initialTurfs?: Turf[];
}

export function HeroBanner({ initialTurfs = [] }: HeroBannerProps) {
  const { user, firebaseUser } = useAuth();
  const { location, requestLocation, loading: locationLoading } = useGeolocation();
  const router = useRouter();

  // Use server-provided data immediately — no loading state needed on first render
  const [turfs, setTurfs] = useState<Turf[]>(initialTurfs);
  const [loading, setLoading] = useState(initialTurfs.length === 0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasLocationFetched, setHasLocationFetched] = useState(false);

  // Re-fetch with location when available (silent update, no spinner)
  useEffect(() => {
    if (!location || hasLocationFetched) return;

    const fetchWithLocation = async () => {
      try {
        const url = `/api/turfs/premium-nearest?limit=4&lat=${location.lat}&lng=${location.lng}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.success && data.turfs && data.turfs.length > 0) {
          setTurfs(data.turfs);
        }
      } catch (error) {
        console.error('Failed to fetch location-based turfs:', error);
      } finally {
        setHasLocationFetched(true);
      }
    };

    fetchWithLocation();
  }, [location, hasLocationFetched]);

  // Fallback: fetch if no initial data was provided (shouldn't happen normally)
  useEffect(() => {
    if (initialTurfs.length > 0) return;

    const fetchPremiumTurfs = async () => {
      try {
        setLoading(true);
        let url = '/api/turfs/premium-nearest?limit=4';
        if (location) {
          url += `&lat=${location.lat}&lng=${location.lng}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (data.success && data.turfs && data.turfs.length > 0) {
          setTurfs(data.turfs);
        } else {
          setTurfs([]);
        }
      } catch (error) {
        console.error('Failed to fetch premium turfs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPremiumTurfs();
  }, [initialTurfs.length, location]);

  // Request location silently if logged in but location not granted yet
  useEffect(() => {
    if (firebaseUser && user && !location && !locationLoading) {
      // Small delay to allow initial load to happen smoothly
      const timer = setTimeout(() => {
        requestLocation();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [firebaseUser, user, location, requestLocation, locationLoading]);

  // Handle auto-swapping carousel
  useEffect(() => {
    if (turfs.length <= 1) return; // No need to swap if 0 or 1 turf

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % turfs.length);
    }, 7000); // Swap every 7 seconds

    return () => clearInterval(timer);
  }, [turfs.length]);

  const currentTurf = turfs[currentIndex];

  // Only show spinner if we have NO initial data AND are still loading
  if (loading && turfs.length === 0) {
    return (
      <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-white animate-spin" />
      </div>
    );
  }
  
  // Fallback if no turfs found
  if (!currentTurf) {
     return (
       <div className="w-full h-screen bg-gradient-to-br from-green-900 to-blue-900 flex flex-col items-center justify-center text-white p-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Discover Your Next Game</h1>
          <p className="text-xl max-w-2xl mb-8 text-gray-200">Book premium turfs near you. Instantly.</p>
          <div className="flex gap-4">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200 uppercase font-semibold" onClick={() => router.push('/browse')}>
               <Search className="mr-2 h-5 w-5 fill-current" /> Browse All
            </Button>
          </div>
       </div>
     );
  }

  const isUserLoggedIn = !!(firebaseUser && user);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center group">
      
      {/* Sponsored Mark at Top Right */}
      <div className="absolute top-24 right-4 sm:right-8 z-40 text-white/30 text-xs tracking-[0.2em] font-light uppercase mix-blend-screen pointer-events-none">
        Sponsored
      </div>

      {/* Carousel Background Images */}
      {turfs.map((turf, idx) => {
        // Fallback sequence: custom Banner Image -> First Image from array -> default
        let tImageUrl = turf.bannerImage || turf.featuredImage || (turf.images && turf.images.length > 0 ? turf.images[0].url : 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1920&q=80');
        
        // Use Cloudinary auto-quality optimization at 1280px width
        if (tImageUrl.includes('cloudinary.com')) {
          tImageUrl = tImageUrl.replace(/\/upload\/(?:[a-zA-Z0-9_,]+\/)?/, '/upload/q_auto,w_1280,f_auto,c_fill/');
        }

        return (
          <div
            key={turf._id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div className={`relative w-full h-full transition-all duration-1000 ${!isUserLoggedIn ? 'blur-md scale-105' : 'blur-0'}`}>
              <Image
                src={tImageUrl}
                alt={turf.name}
                fill
                quality={75}
                sizes="100vw"
                className={`object-cover object-center`}
                priority={idx === 0}
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            </div>
            {/* Added overlay to darken blur state slightly more so text pops */}
            {!isUserLoggedIn && <div className="absolute inset-0 bg-black/40 z-10"></div>}
          </div>
        );
      })}

      {/* Gradient Overlays (Netflix Style) */}
      <div className="absolute inset-0 z-20 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
      <div className="absolute inset-x-0 bottom-0 z-20 h-40 bg-gradient-to-t from-gray-900/90 to-transparent"></div>

      {/* Content Container */}
      <div className="relative z-30 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col justify-end h-full pb-20 sm:pb-32">
         {/* Animated Content Wrapper */}
         <div 
           key={isUserLoggedIn ? currentTurf._id : 'promo-banner-static'} 
           className="animate-in fade-in slide-in-from-bottom-6 duration-700"
         >
            {isUserLoggedIn ? (
              <>
                {/* Premium Badge & Distance */}
                <div className="flex items-center gap-3 mb-4 text-sm md:text-base font-semibold text-white drop-shadow-md mt-auto">
                  <span className="text-red-600 tracking-widest uppercase bg-red-600/10 px-2 py-1 rounded">Premium</span>
                  {currentTurf.rating && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 mr-1 fill-current" />
                        {currentTurf.rating.toFixed(1)}
                      </span>
                    </>
                  )}
                </div>
                
                {/* Turf Title (Netflix Logo Style) */}
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-none drop-shadow-2xl mb-4 max-w-4xl font-serif uppercase tracking-tight">
                  {currentTurf.name}
                </h1>
                
                {/* Sports tags */}
                {currentTurf.sportsOffered && currentTurf.sportsOffered.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6 max-w-2xl">
                     {currentTurf.sportsOffered.slice(0,4).map((bg: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-sm text-xs font-bold text-white uppercase tracking-widest border border-white/20">
                           {bg}
                        </span>
                     ))}
                  </div>
                )}

                {/* Description */}
                <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8 drop-shadow-lg line-clamp-3 font-light">
                  {currentTurf.description || "Experience top-tier facilities, verified bookings, and pure sporting joy at one of our highest-rated partner turfs."}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Primary Button */}
                  <Button 
                    size="lg" 
                    className="bg-white hover:bg-gray-200 text-black px-8 py-7 rounded uppercase font-bold tracking-wide text-lg md:text-xl flex items-center transition-transform hover:scale-105 shadow-xl"
                    onClick={() => router.push(`/book/${currentTurf._id}`)}
                  >
                    <Play className="h-6 w-6 mr-3 fill-current" />
                    Book Now
                  </Button>
                  
                  {/* Secondary Button */}
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-gray-600/40 hover:bg-gray-600/60 border border-white/20 text-white px-8 py-7 rounded backdrop-blur-sm uppercase font-bold tracking-wide text-lg md:text-xl flex items-center transition-all hover:scale-105 shadow-xl"
                    onClick={() => router.push(user?.role === 'owner' ? '/owner/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/dashboard/player')}
                  >
                    <Info className="h-6 w-6 mr-3" />
                    Dashboard
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Promo Welcome Banner Elements */}
                <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-xs sm:text-sm font-bold uppercase tracking-widest backdrop-blur-md mt-auto">
                  🎉 Special Welcome Offer
                </div>
                
                <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-white mb-4 tracking-tight drop-shadow-2xl leading-none uppercase">
                  Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">₹100 Off</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl font-medium drop-shadow-xl leading-relaxed">
                  Book premium sports arenas nearby. Use code <span className="font-mono bg-white/20 px-3 py-1 rounded text-white font-bold select-all border border-white/30 truncate hidden sm:inline-block ml-2">WELCOME100</span> at checkout.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    className="bg-green-500 hover:bg-green-400 text-black px-8 py-7 rounded text-lg md:text-xl font-black uppercase tracking-wider shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all flex items-center hover:scale-105"
                    onClick={() => router.push('/auth/register')}
                  >
                    <Play className="h-6 w-6 mr-3 fill-current" />
                    Sign Up & Claim
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-8 py-7 rounded text-lg md:text-xl font-bold backdrop-blur-sm uppercase tracking-wider shadow-xl transition-all hover:scale-105 flex items-center"
                    onClick={() => router.push('/browse')}
                  >
                    <Search className="h-6 w-6 mr-3" />
                    Browse Arenas
                  </Button>
                </div>
              </>
            )}
         </div>
      </div>

      {/* Carousel Indicators - Hide on very small screens or limit */}
      {turfs.length > 1 && (
        <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
          {turfs.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 sm:w-2 h-8 sm:h-10 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'bg-white h-12 sm:h-16' : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
