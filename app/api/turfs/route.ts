import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Turf from "@/app/models/Turf";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const sportsParam =
      searchParams.get("sports") || searchParams.get("sport") || "";
    const amenitiesParam = searchParams.get("amenities") || "";
    const city = searchParams.get("city") || "";
    const minPrice = parseInt(searchParams.get("minPrice") || "0");
    const maxPrice = parseInt(searchParams.get("maxPrice") || "10000");
    const minRating = parseFloat(searchParams.get("minRating") || "0");
    const sortBy = searchParams.get("sortBy") || "newest";

    // ⭐ Geo params (only for distance sort)
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const isDistanceSort = sortBy === "distance" && !isNaN(lat) && !isNaN(lng);

    // Build filter query
    const query: any = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
        { "location.address": { $regex: search, $options: "i" } },
        { "contactInfo.businessName": { $regex: search, $options: "i" } },
      ];
    }

    if (sportsParam && sportsParam !== "all") {
      const sports = sportsParam
        .split(",")
        .map((s: string) => s.trim())
        .filter((s: string) => s);
      if (sports.length > 0) query.sportsOffered = { $in: sports };
    }

    if (amenitiesParam) {
      const amenities = amenitiesParam
        .split(",")
        .map((a: string) => a.trim())
        .filter((a: string) => a);
      if (amenities.length > 0) query.amenities = { $all: amenities };
    }

    if (city && city !== "all") {
      query["location.city"] = { $regex: city, $options: "i" };
    }

    if (minPrice > 0 || maxPrice < 10000) {
      query.pricing = { $gte: minPrice, $lte: maxPrice };
    }

    if (minRating > 0) {
      query.rating = { $gte: minRating };
    }

    // Sort options for non-distance sorts
    const sortOptions: any = {};
    switch (sortBy) {
      case "price-low":
      case "price_low":
        sortOptions.pricing = 1;
        break;
      case "price-high":
      case "price_high":
        sortOptions.pricing = -1;
        break;
      case "rating":
        sortOptions.rating = -1;
        break;
      case "popularity":
        sortOptions.reviewCount = -1;
        break;
      case "newest":
      default:
        sortOptions.createdAt = -1;
    }

    const skip = (page - 1) * limit;

    console.log(
      "🔍 Browse API — Sort:",
      sortBy,
      isDistanceSort ? `(lat: ${lat}, lng: ${lng})` : "",
    );

    // ⭐ Owner verification stages (shared between both pipelines)
    const ownerVerificationStages = [
      {
        $lookup: {
          from: "users",
          localField: "ownerId",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: "$owner" },
      {
        $match: {
          "owner.role": "owner",
          "owner.isVerifiedByAdmin": true,
          "owner.verificationStatus": "approved",
        },
      },
    ];

    // ⭐ Projection stage (shared)
    const projectStage = {
      $project: {
        owner: 0,
      },
    };

    let turfs: any[];
    let total: number;

    try {
      if (isDistanceSort) {
        // ═══════════════════════════════════════════════
        // ⭐ DISTANCE SORT: Use $geoNear pipeline
        // $geoNear MUST be first stage in pipeline
        // ═══════════════════════════════════════════════

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

        // Main query
        turfs = await Turf.aggregate([
          geoNearStage,
          ...ownerVerificationStages,
          // Distance already sorted by $geoNear
          { $skip: skip },
          { $limit: limit },
          distanceFields,
          projectStage,
        ]);

        // Count query
        const countResult = await Turf.aggregate([
          geoNearStage,
          ...ownerVerificationStages,
          { $count: "total" },
        ]);
        total = countResult[0]?.total || 0;
      } else {
        // ═══════════════════════════════════════════════
        // NORMAL SORT: Existing pipeline (unchanged)
        // ═══════════════════════════════════════════════

        turfs = await Turf.aggregate([
          { $match: query },
          ...ownerVerificationStages,
          { $sort: sortOptions },
          { $skip: skip },
          { $limit: limit },
          projectStage,
        ]);

        const countResult = await Turf.aggregate([
          { $match: query },
          ...ownerVerificationStages,
          { $count: "total" },
        ]);
        total = countResult[0]?.total || 0;
      }

      console.log(
        "✅ Found turfs:",
        turfs.length,
        "/",
        total,
        "total",
        isDistanceSort ? "(distance sort)" : "",
      );

      // Transform data for frontend
      const transformedTurfs = turfs.map((turf: any) => ({
        _id: turf._id,
        name: turf.name,
        description: turf.description,
        businessName: turf.contactInfo?.businessName || turf.name,
        featuredImage: turf.featuredImage,
        images: turf.images,
        sportsOffered: turf.sportsOffered,
        customSport: turf.customSport,
        amenities: turf.amenities,
        pricing: turf.pricing,
        rating: turf.rating || 0,
        reviewCount: turf.reviewCount || 0,
        location: turf.location,
        availableSlots: turf.availableSlots,
        contactInfo: {
          phone: turf.contactInfo?.phone,
          businessName: turf.contactInfo?.businessName,
        },
        owner: turf.ownerId,
        createdAt: turf.createdAt,
        updatedAt: turf.updatedAt,
        // ⭐ Include distance fields when sorting by distance
        ...(isDistanceSort && {
          distance: turf.distance,
          distanceInKm: turf.distanceInKm,
          distanceDisplay: turf.distanceDisplay,
        }),
      }));

      // Get available filter options (independent of sort)
      const cities = await Turf.distinct("location.city", {
        isActive: true,
        "location.city": { $exists: true, $ne: "" },
      });

      const allSports = await Turf.aggregate([
        { $match: { isActive: true } },
        { $unwind: "$sportsOffered" },
        { $group: { _id: "$sportsOffered", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      const sports = allSports
        .map((item: any) => item._id)
        .filter((sport: any) => sport !== "Other");

      return NextResponse.json({
        turfs: transformedTurfs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
        filters: {
          cities: cities.filter((c: any) => c),
          sports,
          priceRange: {
            min: await Turf.find(query)
              .sort({ pricing: 1 })
              .limit(1)
              .select("pricing")
              .then((res: any) => res[0]?.pricing || 0),
            max: await Turf.find(query)
              .sort({ pricing: -1 })
              .limit(1)
              .select("pricing")
              .then((res: any) => res[0]?.pricing || 10000),
          },
        },
      });
    } catch (mongoError: any) {
      console.error("❌ Error in Turf query:", mongoError);

      // ⭐ Handle geoNear specific errors gracefully
      if (
        mongoError?.message?.includes("2dsphere") ||
        mongoError?.message?.includes("geoNear")
      ) {
        console.error(
          "Geospatial query error — likely no turfs have geoLocation data yet",
        );
        return NextResponse.json({
          turfs: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
            hasNextPage: false,
            hasPrevPage: false,
          },
          filters: {
            cities: [],
            sports: [],
            priceRange: { min: 0, max: 10000 },
          },
          message:
            "No turfs with location data found. Owners need to add map location to their turfs.",
        });
      }

      if (
        mongoError?.name === "MongoNetworkError" ||
        mongoError?.name === "MongoServerSelectionError" ||
        mongoError?.message?.includes("ENOTFOUND") ||
        mongoError?.message?.includes("connection")
      ) {
        console.log("MongoDB connection error");
        // Your existing mock data fallback...
        const mockTurfs = [
          {
            _id: "mock1",
            name: "Green Valley Sports Complex",
            description: "Premium football turf",
            businessName: "Green Valley Sports",
            featuredImage:
              "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500",
            images: [
              {
                url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500",
                public_id: "mock1",
              },
            ],
            sportsOffered: ["Football", "Cricket"],
            amenities: ["Floodlights", "Parking"],
            pricing: 800,
            rating: 4.5,
            reviewCount: 24,
            location: {
              city: "Mumbai",
              address: "123 Sports Avenue",
              state: "Maharashtra",
              pincode: "400001",
            },
            availableSlots: [
              { day: "Monday", startTime: "06:00", endTime: "22:00" },
            ],
            contactInfo: {
              phone: "+91 9876543210",
              businessName: "Green Valley Sports",
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        return NextResponse.json({
          turfs: mockTurfs,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            itemsPerPage: 12,
            hasNextPage: false,
            hasPrevPage: false,
          },
          filters: {
            cities: ["Mumbai"],
            sports: ["Football", "Cricket"],
            priceRange: { min: 500, max: 2000 },
          },
        });
      } else {
        throw mongoError;
      }
    }
  } catch (error: any) {
    console.error("Error fetching turfs:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
