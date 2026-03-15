import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerId, paymentDetails } = body;

    if (!ownerId) {
      return NextResponse.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      );
    }

    if (!paymentDetails || !paymentDetails.amount || !paymentDetails.transactionId) {
      return NextResponse.json(
        { error: 'Payment details are required' },
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
    owner.isVerifiedByAdmin = true;
    owner.paymentVerified = true;
    owner.verificationStatus = 'approved';
    owner.paymentDetails = {
      amount: paymentDetails.amount,
      transactionId: paymentDetails.transactionId,
      method: paymentDetails.method || 'UPI',
      date: paymentDetails.date || new Date(),
    };
    owner.verifiedAt = new Date();
    owner.rejectionReason = undefined; // Clear any previous rejection reason

    await owner.save();

    return NextResponse.json({
      success: true,
      message: 'Owner verified successfully',
      owner: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        verificationStatus: owner.verificationStatus,
      },
    });

  } catch (error: any) {
    console.error('Error verifying owner:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
