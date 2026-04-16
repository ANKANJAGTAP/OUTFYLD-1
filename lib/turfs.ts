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
