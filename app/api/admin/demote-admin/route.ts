import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/demote-admin
 * Demotes an admin back to customer role
 * Note: We demote to 'customer' as default. If you want to track original role,
 * you would need to add a field to store it during promotion.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId } = body;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Find the admin
    const adminToDemote = await User.findById(adminId);
    if (!adminToDemote) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Check if user is actually an admin
    if (adminToDemote.role !== 'admin') {
      return NextResponse.json(
        { error: 'User is not an admin' },
        { status: 400 }
      );
    }

    // Check if this is the last admin
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot demote the last admin. At least one admin must exist.' },
        { status: 400 }
      );
    }

    // Demote to customer (default role)
    // If you want to restore original role, you'd need to store it during promotion
    adminToDemote.role = 'customer';
    
    await adminToDemote.save();

    return NextResponse.json({
      success: true,
      message: `Admin demoted successfully`,
      user: {
        _id: adminToDemote._id,
        name: adminToDemote.name,
        email: adminToDemote.email,
        role: adminToDemote.role,
      },
    });

  } catch (error: any) {
    console.error('Error demoting admin:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
