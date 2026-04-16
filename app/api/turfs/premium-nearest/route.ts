import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Turf from "@/app/models/Turf";
import { getCachedData } from "@/lib/redis";

export const dynamic = "force-dynamic";

// ─── In-Memory Cache ────────────────────────────────────────────
// Premium turfs change infrequently. Cache them for 5 minutes per
// location bucket to avoid repeated heavy $lookup aggregations.
interface PremiumCache {
  data: any[];
  cachedAt: number;
}

const premiumCacheMap = new Map<string, PremiumCache>();
const PREMIUM_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 50; // Limit memory usage

function getCacheKey(lat?: number, lng?: number): string {
  if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
    return 'no-location';
  }
  // Round to 2 decimal places (~1.1km precision) — sufficient for cache bucketing
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

function getFromCache(key: string): any[] | null {
  const entry = premiumCacheMap.get(key);
  if (entry && Date.now() - entry.cachedAt < PREMIUM_CACHE_TTL) {
    return entry.data;
  }
  if (entry) premiumCacheMap.delete(key); // Expired
  return null;
}

function setCache(key: string, data: any[]): void {
  // Evict oldest entries if cache is too large
  if (premiumCacheMap.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = premiumCacheMap.keys().next().value;
    if (oldestKey) premiumCacheMap.delete(oldestKey);
  }
  premiumCacheMap.set(key, { data, cachedAt: Date.now() });
}

// ─── Shared response headers ────────────────────────────────────
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
} as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const limit = parseInt(searchParams.get("limit") || "4");

    // ── Check in-memory cache first ──
    const cacheKey = getCacheKey(lat, lng);
    const memoryCached = getFromCache(cacheKey);
    if (memoryCached) {
      return NextResponse.json(
        { success: true, turfs: memoryCached },
        { headers: CACHE_HEADERS }
      );
    }

    // ── Check Redis cache (survives Vercel cold starts) ──
    const redisCacheKey = `premium-turfs:${cacheKey}`;
    const redisCached = await getCachedData<any[] | null>(
      redisCacheKey,
      300, // 5 min TTL
      async () => null // We'll set it manually after DB fetch
    );
    if (redisCached && redisCached.length > 0) {
      setCache(cacheKey, redisCached); // Populate in-memory too
      return NextResponse.json(
        { success: true, turfs: redisCached },
        { headers: CACHE_HEADERS }
      );
    }

    await connectMongoDB();

    const query: any = { isActive: true };
    const hasLocation = !isNaN(lat) && !isNaN(lng);

    // ── Owner verification lookup (shared across all paths) ──
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

    // ── Priority scoring — pro subscribers ranked higher, then by rating ──
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

    let turfs: any[] = [];

    if (hasLocation) {
      // ── GeoNear path — single query with priority scoring ──
      turfs = await Turf.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point" as const,
              coordinates: [lng, lat] as [number, number],
            },
            distanceField: "distance" as const,
            spherical: true,
            query: query,
          },
        },
        ...ownerLookupStages,
        priorityScoring,
        { $sort: { _priority: -1, distance: 1, rating: -1 } },
        { $limit: limit },
        {
          $addFields: {
            distanceInKm: {
              $round: [{ $divide: ["$distance", 1000] }, 1],
            },
            distanceDisplay: {
              $cond: {
                if: { $lt: ["$distance", 1000] },
                then: {
                  $concat: [
                    { $toString: { $round: ["$distance", 0] } },
                    "m away",
                  ],
                },
                else: {
                  $concat: [
                    {
                      $toString: {
                        $round: [{ $divide: ["$distance", 1000] }, 1],
                      },
                    },
                    "km away",
                  ],
                },
              },
            },
          },
        },
        { $project: { owner: 0, _priority: 0 } },
      ]);
    }

    // ── Fallback: no location OR geo query returned empty ──
    if (!hasLocation || turfs.length === 0) {
      turfs = await Turf.aggregate([
        { $match: query },
        ...ownerLookupStages,
        priorityScoring,
        { $sort: { _priority: -1, rating: -1, createdAt: -1 } },
        { $limit: limit },
        { $project: { owner: 0, _priority: 0 } },
      ]);
    }

    // ── Cache the result (in-memory + Redis) ──
    setCache(cacheKey, turfs);
    // Write to Redis asynchronously (don't block response)
    getCachedData(redisCacheKey, 300, async () => turfs).catch(() => {});

    return NextResponse.json(
      { success: true, turfs },
      { headers: CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error("Error fetching premium turfs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch premium turfs" },
      { status: 500 }
    );
  }
}
