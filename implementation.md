# Implementation Details: Dynamic Hero Banner

## Architecture
The new dynamic hero banner is built to replace the static hero on the landing page (`app/page.tsx`). Its behavior splits fundamentally based on two contexts: Authentication (`useAuth`) and Geolocation (`useGeolocation`).

## 1. Backend Changes
We need a lightweight API route that quickly fetches up to 4 turfs. 
- **Route:** `GET /api/turfs/premium-nearest`
- **Query Params:** `lat` (float), `lng` (float)
- **MongoDB Pipeline:**
  1. `$geoNear` to sort by distance (requires 2dsphere index).
  2. `$match` for `isActive: true` and a condition to verify the turf is a "Pro" user (will verify `Turf` or `User` model to map this. If no clear subscription exists, we might fallback to highest rating or manually tag turfs as `isPremium: true`).
  3. `$limit` to exactly 4 records.
  4. Mapping logic to inject the calculated distance into the returned objects.

## 2. Frontend Components
**Component Location:** `components/landing/HeroBanner.tsx`

### Unauthenticated State (Promo View)
- A visually striking static layout.
- Copy: "Get ₹100 Off! Use code WELCOME100 on your first booking."
- Button 1: "Sign Up & Claim" (Links to `/auth/register`)
- Button 2: "Browse Turfs" (Links to `/browse`)

### Authenticated State (Netflix Carousel View)
- Uses `framer-motion` or standard CSS animations for swapping backgrounds.
- Will implement `useEffect` with a `setInterval` to cycle through the fetched 4 turfs every 5-7 seconds.
- Uses `next/image` for optimized background rendering with a CSS gradient overlay (`bg-gradient-to-r from-black/80 via-black/50 to-transparent`).
- **UI Elements:**
  - `Title`: Large, prominent, matching Netflix title scaling.
  - `Metadata`: Distance, Rating, Sports offered.
  - `Book Now`: Primary white action button (links to `/book/[id]`).
  - `Go to Dashboard`: Secondary dark/translucent action button (links to `/dashboard/player`).

## 3. Integration
- Open `app/page.tsx`
- Replace `<HeroSection />` (or equivalent) with `<HeroBanner />`.
- Ensure `AuthContext` and `LocationContext` are properly wrapped around it (they should already be at the layout level).