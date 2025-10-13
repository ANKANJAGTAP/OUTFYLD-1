import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/all-users
 * Returns all users in the system (for admin management)
 */
export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    // Get all users
    const users = await User.find(
      {},
      {
        uid: 1,
        name: 1,
        email: 1,
        phone: 1,
        role: 1,
        createdAt: 1,
      }
    ).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
