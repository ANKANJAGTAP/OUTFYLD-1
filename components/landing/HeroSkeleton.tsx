/**
 * Lightweight skeleton placeholder for the Hero banner.
 * Rendered server-side as the Suspense fallback — shows instantly
 * while HeroBanner hydrates with real data.
 */
export function HeroSkeleton() {
  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden flex items-end">
      {/* Gradient overlays matching real hero */}
      <div className="absolute inset-0 z-20 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-20 h-40 bg-gradient-to-t from-gray-900/90 to-transparent" />

      {/* Content skeleton */}
      <div className="relative z-30 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-20 sm:pb-32">
        {/* Badge skeleton */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-6 w-16 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Title skeleton */}
        <div className="space-y-3 mb-6">
          <div className="h-12 sm:h-16 w-3/4 max-w-2xl bg-white/10 rounded animate-pulse" />
          <div className="h-12 sm:h-16 w-1/2 max-w-xl bg-white/10 rounded animate-pulse" />
        </div>

        {/* Sport tags skeleton */}
        <div className="flex gap-2 mb-6">
          <div className="h-7 w-20 bg-white/10 rounded animate-pulse" />
          <div className="h-7 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-7 w-16 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Description skeleton */}
        <div className="space-y-2 mb-8 max-w-2xl">
          <div className="h-5 w-full bg-white/10 rounded animate-pulse" />
          <div className="h-5 w-3/4 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Button skeletons */}
        <div className="flex gap-4">
          <div className="h-14 w-44 bg-white/20 rounded animate-pulse" />
          <div className="h-14 w-44 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
