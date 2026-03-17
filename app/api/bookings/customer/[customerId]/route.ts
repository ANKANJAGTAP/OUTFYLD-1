import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Booking from '@/app/models/Booking';
import User from '@/app/models/User';
import '@/app/models/Turf'; // Needed for population
import Turf from '@/app/models/Turf';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    await connectMongoDB();

    // Ensure Turf is loaded to prevent MissingSchemaError during populate
    if (Turf) {
      console.log('Turf model loaded');
    }

    const { customerId } = params;

    // Look up customer — try Firebase UID first (frontend sends user.uid), fallback to MongoDB _id
    let customer;
    try {
      customer = await User.findOne({ uid: customerId });
    } catch {
      // not found by uid, will try _id below
    }
    if (!customer) {
      try {
        customer = await User.findById(customerId);
      } catch {
        // invalid ObjectId format
      }
    }
    if (!customer || customer.role !== 'customer') {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    // Get query parameters for filtering and pagination
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter query using the resolved user's MongoDB _id
    const filterQuery: any = { customerId: customer._id };
    
    if (status && ['pending', 'confirmed', 'rejected'].includes(status)) {
      filterQuery.status = status;
    }

    // Fetch bookings with pagination
    const [bookings, totalCount] = await Promise.all([
      Booking.find(filterQuery)
        .populate('ownerId', 'name email businessName phone')
        .populate('turfId', 'name businessName location contactInfo pricing sportsOffered amenities images')
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
    console.error('Error fetching customer bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}