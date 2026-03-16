# Task Tracker: Dynamic Hero Banner Implementation

1. [x] **Analyze existing `Turf` and `User`/`Subscription` models** tracking to confirm how "Pro" plan turfs are currently identified (or add a placeholder field if it doesn't exist).
2. [x] **Create API Endpoint (`/api/turfs/premium-nearest`)**
   - Accept `lat` and `lng` parameters.
   - Use `$geoNear` to calculate distances.
   - Filter to return a maximum of 4 active, "Premium/Pro" plan turfs.
3. [x] **Build `HeroBanner` Component**
   - Consume `AuthContext` to check if the user is logged in.
   - Consume `LocationContext` to get `lat`/`lng`.
   - **Logged Out State:** Show promotional "WELCOME100" banner with action buttons.
   - **Logged In State:** Fetch the premium nearest turfs. Display them in an auto-playing carousel with a Netflix-style UI (dark gradient overlay, Title, Description/Rating, "Book Now" and "Go to Dashboard" buttons).
4. [x] **Integrate component into the Landing Page (`app/page.tsx`)**
   - Replace the existing top hero section with the new `HeroBanner`.
