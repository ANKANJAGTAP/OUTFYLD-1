import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

/**
 * API endpoint to create or verify the admin account
 * This should be run once during initial setup
 * 
 * Usage:
 * POST /api/admin/setup
 * Body: {
 *   "adminEmail": "admin@example.com",
 *   "adminUid": "firebase-uid-of-admin",
 *   "adminName": "Admin Name",
 *   "setupKey": "your-secret-setup-key"
 * }
 * 
 * Note: Set ADMIN_SETUP_KEY in your environment variables
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminEmail, adminUid, adminName, setupKey } = body;

    // Verify setup key (in production, use environment variable)
    const expectedSetupKey = process.env.ADMIN_SETUP_KEY || 'change-this-in-production';
    
    if (setupKey !== expectedSetupKey) {
      return NextResponse.json(
        { error: 'Invalid setup key' },
        { status: 403 }
      );
    }

    if (!adminEmail || !adminUid || !adminName) {
      return NextResponse.json(
        { error: 'Admin email, UID, and name are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectMongoDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ uid: adminUid });
    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        return NextResponse.json({
          success: true,
          message: 'Admin account already exists',
          admin: {
            _id: existingAdmin._id,
            name: existingAdmin.name,
            email: existingAdmin.email,
            role: existingAdmin.role,
          },
        });
      } else {
        // Update existing user to admin
        existingAdmin.role = 'admin';
        existingAdmin.isVerifiedByAdmin = true;
        existingAdmin.verificationStatus = 'approved';
        await existingAdmin.save();
        
        return NextResponse.json({
          success: true,
          message: 'Existing user upgraded to admin',
          admin: {
            _id: existingAdmin._id,
            name: existingAdmin.name,
            email: existingAdmin.email,
            role: existingAdmin.role,
          },
        });
      }
    }

    // Create new admin user
    const admin = new User({
      uid: adminUid,
      name: adminName,
      email: adminEmail,
      role: 'admin',
      emailVerified: true,
      isActive: true,
      isVerifiedByAdmin: true,
      verificationStatus: 'approved',
    });

    await admin.save();

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error: any) {
    console.error('Error setting up admin:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if an admin exists
export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const adminCount = await User.countDocuments({ role: 'admin' });

    return NextResponse.json({
      success: true,
      adminExists: adminCount > 0,
      adminCount,
    });

  } catch (error: any) {
    console.error('Error checking admin:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
