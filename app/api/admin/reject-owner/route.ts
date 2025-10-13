import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerId, rejectionReason } = body;

    if (!ownerId) {
      return NextResponse.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      );
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
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

    // Update the owner's verification status
    owner.isVerifiedByAdmin = false;
    owner.paymentVerified = false;
    owner.verificationStatus = 'rejected';
    owner.rejectionReason = rejectionReason;

    await owner.save();

    return NextResponse.json({
      success: true,
      message: 'Owner application rejected',
      owner: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        verificationStatus: owner.verificationStatus,
        rejectionReason: owner.rejectionReason,
      },
    });

  } catch (error: any) {
    console.error('Error rejecting owner:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
