import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';

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
    } else if (action === 'revoke') {
      // Permanently revoke - set to rejected
      owner.verificationStatus = 'rejected';
      owner.isVerifiedByAdmin = false;
      owner.paymentVerified = false;
      owner.rejectionReason = `REVOKED: ${reason}`;
    }

    owner.updatedAt = new Date();
    await owner.save();

    return NextResponse.json({
      success: true,
      message: `Owner membership ${action === 'suspend' ? 'suspended' : 'revoked'} successfully`,
      owner: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        verificationStatus: owner.verificationStatus,
        rejectionReason: owner.rejectionReason
      }
    });

  } catch (error: any) {
    console.error('Error revoking owner:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
