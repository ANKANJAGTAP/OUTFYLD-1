import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Turf from "@/app/models/Turf";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const limit = parseInt(searchParams.get("limit") || "4");

    const query: any = { isActive: true };
    const hasLocation = !isNaN(lat) && !isNaN(lng);

    const ownerPremiumStages = [
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
          // Require active pro subscription if available.
          // Note: If no user actually has a pro plan yet, this will return empty.
          // In a real staging environment, we might want a fallback.
          "owner.subscriptionPlan": "pro",
          "owner.subscriptionStatus": "active",
        },
      },
    ];

    let turfs: any[] = [];

    // Stage 1: GeoNear if we have location
    if (hasLocation) {
      const geoNearStage = {
        $geoNear: {
          near: {
            type: "Point" as const,
            coordinates: [lng, lat] as [number, number],
          },
          distanceField: "distance" as const,
          spherical: true,
          query: query,
        },
      };

      const distanceFields = {
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
      };

      turfs = await Turf.aggregate([
        geoNearStage,
        ...ownerPremiumStages,
        { $limit: limit },
        distanceFields,
        { $project: { owner: 0 } },
      ]);
    }

    // Fallback: If no location provided, or the geo query returned 0 pro turfs, 
    // fetch top rated/newest premium turfs instead.
    if (!hasLocation || turfs.length === 0) {
      turfs = await Turf.aggregate([
        { $match: query },
        ...ownerPremiumStages,
        { $sort: { rating: -1, createdAt: -1 } },
        { $limit: limit },
        { $project: { owner: 0 } },
      ]);
    }
    
    // Fallback 2: If STILL empty (no users have strictly active 'pro' subscriptions in the DB right now)
    // we fallback to the highest-rated turfs generally, so the banner is never empty.
    if (turfs.length === 0) {
       const fallbackStages = [
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
       
       if (hasLocation) {
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
            ...fallbackStages,
            { $limit: limit },
            {
              $addFields: {
                distanceInKm: {
                  $round: [{ $divide: ["$distance", 1000] }, 1],
                },
                distanceDisplay: {
                  $cond: {
                    if: { $lt: ["$distance", 1000] },
                    then: { $concat: [{ $toString: { $round: ["$distance", 0] } }, "m away"] },
                    else: { $concat: [{ $toString: { $round: [{ $divide: ["$distance", 1000] }, 1] } }, "km away"] },
                  }
                }
              }
            },
            { $project: { owner: 0 } },
         ]);
       } else {
         turfs = await Turf.aggregate([
            { $match: query },
            ...fallbackStages,
            { $sort: { rating: -1, createdAt: -1 } },
            { $limit: limit },
            { $project: { owner: 0 } },
         ]);
       }
    }

    return NextResponse.json({
      success: true,
      turfs,
    });
  } catch (error: any) {
    console.error("Error fetching premium turfs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch premium turfs" },
      { status: 500 }
    );
  }
}
