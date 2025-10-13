import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Booking from '@/app/models/Booking';
import User from '@/app/models/User';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { ownerId: string } }
) {
  try {
    await connectMongoDB();

    const { ownerId } = params;

    // Validate that the owner exists - look up by Firebase UID
    const owner = await User.findOne({ uid: ownerId });
    if (!owner || owner.role !== 'owner') {
      return NextResponse.json(
        { error: 'Invalid owner ID' },
        { status: 400 }
      );
    }

    // Get query parameters for filtering and pagination
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || '';
    const turfId = searchParams.get('turfId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter query - use the owner's MongoDB ObjectId
    const filterQuery: any = { ownerId: owner._id };
    
    if (status && ['pending', 'confirmed', 'rejected'].includes(status)) {
      filterQuery.status = status;
    }

    if (turfId) {
      filterQuery.turfId = turfId;
    }

    // Fetch bookings with pagination
    const [bookings, totalCount] = await Promise.all([
      Booking.find(filterQuery)
        .populate('customerId', 'name email phone')
        .populate('turfId', 'name contactInfo location pricing sportsOffered amenities')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filterQuery)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      bookings,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}