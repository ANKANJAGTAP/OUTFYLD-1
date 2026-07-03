import { connectMongoDB } from "@/lib/mongodb";
import Turf from "@/app/models/Turf";

/**
 * Server-side function to fetch premium turfs for the landing page.
 * Called from the Server Component (app/page.tsx) so the hero
 * gets real data on first paint — no client-side spinner needed.
 * 
 * This mirrors the logic in /api/turfs/premium-nearest but runs
 * directly in the server component context (no HTTP round-trip).
 */

// Simple in-memory cache to avoid re-querying on frequent ISR rebuilds
let serverCache: { data: any[]; cachedAt: number } | null = null;
const SERVER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface PlatformStats {
  turfs: number; // real: active, admin-approved turfs
  cities: number; // real: distinct cities with an active turf
  bookings: number; // placeholder until a bookings aggregate endpoint exists
  rating: number; // placeholder average rating
}

let statsCache: { data: PlatformStats; cachedAt: number } | null = null;

/**
 * Cheap platform stats for the Night Match scoreboard band.
 * Counts that are trivial to compute (turfs, cities) are real; the rest are
 * clearly-marked placeholders, centralized here so they're easy to wire later.
 */
export async function getPlatformStatsServer(): Promise<PlatformStats> {
  if (statsCache && Date.now() - statsCache.cachedAt < SERVER_CACHE_TTL) {
    return statsCache.data;
  }

  // Placeholders — swap for real aggregates when endpoints exist
  const PLACEHOLDER_BOOKINGS = 12480;
  const PLACEHOLDER_RATING = 4.8;

  try {
    await connectMongoDB();
    const [turfs, cities] = await Promise.all([
      Turf.countDocuments({ isActive: true }),
      Turf.distinct("location.city", { isActive: true }).then(
        (c) => c.filter(Boolean).length
      ),
    ]);

    const data: PlatformStats = {
      turfs: turfs || 0,
      cities: cities || 0,
      bookings: PLACEHOLDER_BOOKINGS,
      rating: PLACEHOLDER_RATING,
    };
    statsCache = { data, cachedAt: Date.now() };
    return data;
  } catch (error) {
    console.error("Failed to fetch platform stats server-side:", error);
    return { turfs: 0, cities: 0, bookings: PLACEHOLDER_BOOKINGS, rating: PLACEHOLDER_RATING };
  }
}

export interface SportRackItem {
  sport: 'Cricket' | 'Badminton' | 'Football';
  count: number; // real: active turfs offering this sport
  fromPrice: number | null; // real: cheapest hourly base price, null if none
}

let rackCache: { data: SportRackItem[]; cachedAt: number } | null = null;

/**
 * Per-sport turf count + starting price for the homepage kit-rack set piece.
 * One aggregation over active turfs, matched case-insensitively against the
 * three sports the rack displays.
 */
export async function getSportsRackServer(): Promise<SportRackItem[]> {
  if (rackCache && Date.now() - rackCache.cachedAt < SERVER_CACHE_TTL) {
    return rackCache.data;
  }

  const SPORTS: SportRackItem['sport'][] = ['Cricket', 'Badminton', 'Football'];
  const empty: SportRackItem[] = SPORTS.map((sport) => ({ sport, count: 0, fromPrice: null }));

  try {
    await connectMongoDB();
    const rows: { _id: string; count: number; minPrice: number | null }[] = await Turf.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$sportsOffered' },
      {
        $group: {
          _id: { $toLower: '$sportsOffered' },
          count: { $sum: 1 },
          minPrice: { $min: '$pricing' },
        },
      },
    ]);

    const data = SPORTS.map((sport) => {
      const row = rows.find((r) => r._id === sport.toLowerCase());
      return {
        sport,
        count: row?.count ?? 0,
        fromPrice: row?.minPrice ?? null,
      };
    });
    rackCache = { data, cachedAt: Date.now() };
    return data;
  } catch (error) {
    console.error('Failed to fetch sports rack server-side:', error);
    return empty;
  }
}

export async function getPremiumTurfsServer(limit: number = 4): Promise<any[]> {
  // Return cached data if fresh
  if (serverCache && Date.now() - serverCache.cachedAt < SERVER_CACHE_TTL) {
    return serverCache.data;
  }

  try {
    await connectMongoDB();

    const query = { isActive: true };

    const ownerLookupStages = [
      {
        $lookup: {
          from: "users",
          localField: "ownerId",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: { path: "$owner", preserveNullAndEmptyArrays: false },
      },
      {
        $match: {
          "owner.role": "owner",
          "owner.isVerifiedByAdmin": true,
          "owner.verificationStatus": "approved",
        },
      },
    ];

    // Priority scoring — pro subscribers ranked higher
    const priorityScoring = {
      $addFields: {
        _priority: {
          $cond: {
            if: {
              $and: [
                { $eq: ["$owner.subscriptionPlan", "pro"] },
                { $eq: ["$owner.subscriptionStatus", "active"] },
              ],
            },
            then: 10,
            else: 1,
          },
        },
      },
    };

    // Single query with priority scoring (no location — server-side has no geo)
    const turfs = await Turf.aggregate([
      { $match: query },
      ...ownerLookupStages,
      priorityScoring,
      { $sort: { _priority: -1, rating: -1, createdAt: -1 } },
      { $limit: limit },
      { $project: { owner: 0, _priority: 0 } },
    ]);

    // Serialize to plain objects — MongoDB docs contain ObjectId/Date/Buffer
    // which can't be passed from Server Components to Client Components
    const serialized = JSON.parse(JSON.stringify(turfs));

    // Cache the serialized result
    serverCache = { data: serialized, cachedAt: Date.now() };

    return serialized;
  } catch (error) {
    console.error("Failed to fetch premium turfs server-side:", error);
    return [];
  }
}
