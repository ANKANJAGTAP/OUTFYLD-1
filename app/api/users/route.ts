import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

/**
 * POST /api/users - Create a new user in MongoDB
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { uid, name, email, role } = body;
    
    if (!uid || !name || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, name, email, role' },
        { status: 400 }
      );
    }

    if (!['customer', 'owner'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be either "customer" or "owner"' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('turf_booking');
    const users = db.collection('users');
    
    // Check if user already exists
    const existingUser = await users.findOne({ 
      $or: [{ email }, { uid }] 
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email or Firebase UID' },
        { status: 409 }
      );
    }
    
    // Prepare user data with verification fields for owners
    const userData: any = {
      uid,
      name,
      email: email.toLowerCase(),
      role,
      phone: body.phone || null,
      businessName: role === 'owner' ? body.businessName : null,
      emailVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add verification fields for turf owners
    if (role === 'owner') {
      userData.isVerifiedByAdmin = false;
      userData.paymentVerified = false;
      userData.verificationStatus = 'pending';
    } else {
      // Auto-approve customers and other roles
      userData.isVerifiedByAdmin = true;
      userData.paymentVerified = false;
      userData.verificationStatus = 'approved';
    }
    
    // Insert new user
    const result = await users.insertOne(userData);
    
    return NextResponse.json({ 
      message: 'User created successfully',
      userId: result.insertedId,
      user: {
        ...userData,
        _id: result.insertedId
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users?uid=<firebase_uid> - Get user by Firebase UID
 */
export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    const email = request.nextUrl.searchParams.get('email');
    
    if (!uid && !email) {
      return NextResponse.json(
        { error: 'Either uid or email parameter is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('turf_booking');
    const users = db.collection('users');
    
    let query = {};
    if (uid) {
      query = { uid };
    } else if (email) {
      query = { email: email.toLowerCase() };
    }
    
    const user = await users.findOne(query);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users - Update user data
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, ...updateData } = body;
    
    if (!uid) {
      return NextResponse.json(
        { error: 'Firebase UID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('turf_booking');
    const users = db.collection('users');
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();
    
    const result = await users.updateOne(
      { uid },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get updated user
    const updatedUser = await users.findOne({ uid });
    
    return NextResponse.json({ 
      message: 'User updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}