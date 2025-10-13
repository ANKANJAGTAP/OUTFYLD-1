import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/promote-user
 * Promotes a user to admin role
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Find the user
    const userToPromote = await User.findById(userId);
    if (!userToPromote) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already admin
    if (userToPromote.role === 'admin') {
      return NextResponse.json(
        { error: 'User is already an admin' },
        { status: 400 }
      );
    }

    // Store original role before promotion
    const originalRole = userToPromote.role;

    // Promote to admin
    userToPromote.role = 'admin';
    userToPromote.isVerifiedByAdmin = true;
    userToPromote.verificationStatus = 'approved';
    
    await userToPromote.save();

    return NextResponse.json({
      success: true,
      message: `User promoted to admin successfully`,
      user: {
        _id: userToPromote._id,
        name: userToPromote.name,
        email: userToPromote.email,
        role: userToPromote.role,
        previousRole: originalRole,
      },
    });

  } catch (error: any) {
    console.error('Error promoting user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
