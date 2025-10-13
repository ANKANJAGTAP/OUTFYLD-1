import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
    
    // Parse the token to get user info
    let uid: string;
    let email: string;
    try {
      const [, payload] = idToken.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      uid = decoded.uid || decoded.user_id;
      email = decoded.email;
      
      if (!uid || !email) {
        throw new Error('Missing UID or email in token');
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectMongoDB();

    // Check if user already exists
    const existingUser = await User.findOne({ uid });
    if (existingUser) {
      return NextResponse.json({
        message: 'User already exists',
        user: existingUser
      });
    }

    // Get additional info from request body
    const body = await request.json();
    const { name, role, phone, businessName } = body;

    // Create new user as customer first (no owner validations)
    const newUser = new User({
      uid,
      name: name || 'User',
      email,
      role: 'customer', // Start as customer to avoid owner validations
      phone: phone || null,
      businessName: businessName || null,
      emailVerified: true,
      isActive: true
    });

    await newUser.save();

    // Now update to owner role if requested
    if (role === 'owner') {
      await User.findByIdAndUpdate(newUser._id, { role: 'owner' });
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        _id: newUser._id,
        uid: newUser.uid,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        businessName: newUser.businessName,
        emailVerified: newUser.emailVerified,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}