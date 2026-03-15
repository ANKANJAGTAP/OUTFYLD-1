import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// Temporarily removed Firebase Admin SDK to debug connection issues
console.log('Firebase Admin not initialized, skipping token verification for development');

export async function PUT(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    let uid: string;
    // Temporarily always use fallback for development
    console.log('Using development mode - skipping Firebase Admin token verification');
    console.log('Raw token:', idToken.substring(0, 50) + '...');
    try {
      const [, payload] = idToken.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      uid = decoded.uid || decoded.user_id || 'test-uid-' + Date.now();
      console.log('Decoded UID from token:', uid);
      console.log('Decoded email from token:', decoded.email);
    } catch (error) {
      console.error('Error parsing token payload:', error);
      uid = 'fallback-uid-' + Date.now();
      console.log('Using fallback UID:', uid);
    }

    // Connect to MongoDB
    await connectMongoDB();

    // Find the user
    const user = await User.findOne({ uid });
    console.log('User lookup result:', user ? 'Found user' : 'User not found');
    console.log('Looking for UID:', uid);
    
    if (!user) {
      // Let's also try to find any users with similar UIDs or emails
      const allUsers = await User.find({}, { uid: 1, email: 1, name: 1 }).limit(5);
      console.log('Available users in database:', allUsers);
      return NextResponse.json(
        { error: 'User not found', debug: { searchedUID: uid, availableUsers: allUsers } },
        { status: 404 }
      );
    }

    if (user.role !== 'owner') {
      return NextResponse.json(
        { error: 'User is not an owner' },
        { status: 403 }
      );
    }

    // Get the request body
    const body = await request.json();
    const {
      businessName,
      phone
    } = body;

    // Build update object with only allowed fields
    const updateData: any = {};
    if (businessName !== undefined) updateData.businessName = businessName;
    if (phone !== undefined) updateData.phone = phone;

    // Update user with basic profile fields only
    // Turf-related fields should be managed through /api/turfs/manage endpoint
    const updatedUser = await User.findOneAndUpdate(
      { uid },
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: 'Owner profile updated successfully',
      user: {
        _id: updatedUser._id,
        uid: updatedUser.uid,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        businessName: updatedUser.businessName,
        phone: updatedUser.phone,
        emailVerified: updatedUser.emailVerified,
        isActive: updatedUser.isActive,
        verificationStatus: updatedUser.verificationStatus,
        isVerifiedByAdmin: updatedUser.isVerifiedByAdmin,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating owner profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    let uid: string;
    // Temporarily always use fallback for development
    console.log('GET request - Using development mode - skipping Firebase Admin token verification');
    console.log('GET request - Raw token:', idToken.substring(0, 50) + '...');
    try {
      const [, payload] = idToken.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      uid = decoded.uid || decoded.user_id || 'test-uid-' + Date.now();
      console.log('GET request - Decoded UID from token:', uid);
      console.log('GET request - Decoded email from token:', decoded.email);
    } catch (error) {
      console.error('GET request - Error parsing token payload:', error);
      uid = 'fallback-uid-' + Date.now();
      console.log('GET request - Using fallback UID:', uid);
    }

    // Connect to MongoDB
    await connectMongoDB();

    // Find the user
    const user = await User.findOne({ uid });
    console.log('GET request - User lookup result:', user ? 'Found user' : 'User not found');
    console.log('GET request - Looking for UID:', uid);
    
    if (!user) {
      // Let's also try to find any users with similar UIDs or emails
      const allUsers = await User.find({}, { uid: 1, email: 1, name: 1 }).limit(5);
      console.log('GET request - Available users in database:', allUsers);
      return NextResponse.json(
        { error: 'User not found', debug: { searchedUID: uid, availableUsers: allUsers } },
        { status: 404 }
      );
    }

    if (user.role !== 'owner') {
      return NextResponse.json(
        { error: 'User is not an owner' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        phone: user.phone,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        verificationStatus: user.verificationStatus,
        isVerifiedByAdmin: user.isVerifiedByAdmin,
        paymentVerified: user.paymentVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching owner profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}