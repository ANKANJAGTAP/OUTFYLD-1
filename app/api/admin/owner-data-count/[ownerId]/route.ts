import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';
import Turf from '@/app/models/Turf';
import Booking from '@/app/models/Booking';
import SlotReservation from '@/app/models/SlotReservation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/owner-data-count/[ownerId]
 * Get count of turfs, bookings, and reservations for a specific owner
 * Used for testing cascade deletion
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { ownerId: string } }
) {
  try {
    const { ownerId } = params;

    if (!ownerId) {
      return NextResponse.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Find the owner
    const owner = await User.findById(ownerId);
    if (!owner) {
      return NextResponse.json(
        { error: 'Owner not found' },
        { status: 404 }
      );
    }

    // Count turfs
    const turfs = await Turf.find({ ownerId: ownerId });
    const turfIds = turfs.map(turf => turf._id);

    // Count bookings
    const bookingsCount = await Booking.countDocuments({
      turfId: { $in: turfIds }
    });

    // Count reservations
    const reservationsCount = await SlotReservation.countDocuments({
      turfId: { $in: turfIds }
    });

    return NextResponse.json({
      success: true,
      owner: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        verificationStatus: owner.verificationStatus,
        isVerifiedByAdmin: owner.isVerifiedByAdmin
      },
      counts: {
        turfs: turfs.length,
        bookings: bookingsCount,
        reservations: reservationsCount
      },
      turfIds: turfIds
    });

  } catch (error: any) {
    console.error('Error fetching owner data count:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
