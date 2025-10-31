import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';
import Turf from '@/app/models/Turf';
import Booking from '@/app/models/Booking';
import SlotReservation from '@/app/models/SlotReservation';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/revoke-owner
 * Revoke/Cancel an owner's membership (approved → pending/rejected)
 * This allows admin to cancel an owner's access at any time
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerId, reason, action } = body;

    // Validate required fields
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      );
    }

    if (!action || !['suspend', 'revoke'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "suspend" or "revoke"' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reason for revocation is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectMongoDB();

    // Find the owner
    const owner = await User.findById(ownerId);
    if (!owner) {
      return NextResponse.json(
        { error: 'Owner not found' },
        { status: 404 }
      );
    }

    if (owner.role !== 'owner') {
      return NextResponse.json(
        { error: 'User is not a turf owner' },
        { status: 400 }
      );
    }

    // Update owner status based on action
    if (action === 'suspend') {
      // Suspend temporarily - set to pending (can be re-approved)
      owner.verificationStatus = 'pending';
      owner.isVerifiedByAdmin = false;
      owner.rejectionReason = `SUSPENDED: ${reason}`;
      owner.updatedAt = new Date();
      await owner.save();

      return NextResponse.json({
        success: true,
        message: 'Owner membership suspended successfully',
        owner: {
          _id: owner._id,
          name: owner.name,
          email: owner.email,
          verificationStatus: owner.verificationStatus,
          rejectionReason: owner.rejectionReason
        }
      });
    } else if (action === 'revoke') {
      // Permanently revoke - CASCADE DELETE all related data
      
      // Step 1: Find all turfs owned by this owner
      const ownerTurfs = await Turf.find({ ownerId: ownerId });
      const turfIds = ownerTurfs.map(turf => turf._id);
      
      console.log(`🗑️ CASCADE DELETE: Found ${turfIds.length} turfs for owner ${ownerId}`);

      // Step 2: Delete all bookings for these turfs
      const bookingsDeleted = await Booking.deleteMany({ 
        turfId: { $in: turfIds } 
      });
      console.log(`🗑️ CASCADE DELETE: Deleted ${bookingsDeleted.deletedCount} bookings`);

      // Step 3: Delete all slot reservations for these turfs
      const reservationsDeleted = await SlotReservation.deleteMany({ 
        turfId: { $in: turfIds } 
      });
      console.log(`🗑️ CASCADE DELETE: Deleted ${reservationsDeleted.deletedCount} slot reservations`);

      // Step 4: Delete all turfs
      const turfsDeleted = await Turf.deleteMany({ 
        ownerId: ownerId 
      });
      console.log(`🗑️ CASCADE DELETE: Deleted ${turfsDeleted.deletedCount} turfs`);

      // Step 5: Delete the owner user account
      await User.findByIdAndDelete(ownerId);
      console.log(`🗑️ CASCADE DELETE: Deleted owner account ${ownerId}`);

      return NextResponse.json({
        success: true,
        message: 'Owner permanently revoked and all data deleted',
        deletionSummary: {
          turfsDeleted: turfsDeleted.deletedCount,
          bookingsDeleted: bookingsDeleted.deletedCount,
          reservationsDeleted: reservationsDeleted.deletedCount,
          ownerDeleted: true
        }
      });
    }

    // Fallback (should never reach here due to validation)
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error revoking owner:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
