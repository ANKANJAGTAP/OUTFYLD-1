import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';
import Turf from '@/app/models/Turf';
import Booking from '@/app/models/Booking';
import SlotReservation from '@/app/models/SlotReservation';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 REJECT OWNER API: Request received');
    
    const body = await request.json();
    const { ownerId, rejectionReason } = body;
    
    console.log('📝 REJECT OWNER API: Data received:', { ownerId, rejectionReason: rejectionReason?.substring(0, 50) });

    if (!ownerId) {
      console.error('❌ REJECT OWNER API: Missing ownerId');
      return NextResponse.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      );
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      console.error('❌ REJECT OWNER API: Missing rejectionReason');
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    console.log('🔗 REJECT OWNER API: Connecting to MongoDB...');
    await connectMongoDB();
    console.log('✅ REJECT OWNER API: Connected to MongoDB');

    // Find the owner
    console.log('🔍 REJECT OWNER API: Finding owner with ID:', ownerId);
    const owner = await User.findById(ownerId);
    
    if (!owner) {
      console.error('❌ REJECT OWNER API: Owner not found:', ownerId);
      return NextResponse.json(
        { error: 'Owner not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ REJECT OWNER API: Owner found:', { id: owner._id, name: owner.name, role: owner.role });

    if (owner.role !== 'owner') {
      console.error('❌ REJECT OWNER API: User is not an owner:', owner.role);
      return NextResponse.json(
        { error: 'User is not a turf owner' },
        { status: 400 }
      );
    }

    // CASCADE DELETE: When rejecting an owner, also delete all their turfs and related data
    
    // Step 1: Find all turfs owned by this owner
    const ownerTurfs = await Turf.find({ ownerId: ownerId });
    const turfIds = ownerTurfs.map(turf => turf._id);
    
    console.log(`🗑️ CASCADE DELETE (REJECT): Found ${turfIds.length} turfs for owner ${ownerId}`);

    // Step 2: Delete all bookings for these turfs
    const bookingsDeleted = await Booking.deleteMany({ 
      turfId: { $in: turfIds } 
    });
    console.log(`🗑️ CASCADE DELETE (REJECT): Deleted ${bookingsDeleted.deletedCount} bookings`);

    // Step 3: Delete all slot reservations for these turfs
    const reservationsDeleted = await SlotReservation.deleteMany({ 
      turfId: { $in: turfIds } 
    });
    console.log(`🗑️ CASCADE DELETE (REJECT): Deleted ${reservationsDeleted.deletedCount} slot reservations`);

    // Step 4: Delete all turfs
    const turfsDeleted = await Turf.deleteMany({ 
      ownerId: ownerId 
    });
    console.log(`🗑️ CASCADE DELETE (REJECT): Deleted ${turfsDeleted.deletedCount} turfs`);

    // Step 5: Update the owner's verification status (keep the user account but mark as rejected)
    console.log('👤 REJECT OWNER API: Updating owner status...');
    owner.isVerifiedByAdmin = false;
    owner.paymentVerified = false;
    owner.verificationStatus = 'rejected';
    owner.rejectionReason = rejectionReason;
    await owner.save();
    console.log('✅ REJECT OWNER API: Owner status updated successfully');

    console.log('🎉 REJECT OWNER API: Rejection completed successfully');
    return NextResponse.json({
      success: true,
      message: 'Owner application rejected and all turfs deleted',
      owner: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        verificationStatus: owner.verificationStatus,
        rejectionReason: owner.rejectionReason,
      },
      deletionSummary: {
        turfsDeleted: turfsDeleted.deletedCount,
        bookingsDeleted: bookingsDeleted.deletedCount,
        reservationsDeleted: reservationsDeleted.deletedCount
      }
    });

  } catch (error: any) {
    console.error('❌ REJECT OWNER API: Critical error occurred');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error?.message || 'Unknown error',
        type: error?.constructor?.name || 'Unknown'
      },
      { status: 500 }
    );
  }
}
