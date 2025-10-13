import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';
import Turf from '@/app/models/Turf';

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
    
    // Verify the Firebase ID token and get UID
    let uid: string;
    let email: string;
    try {
      const [, payload] = idToken.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      uid = decoded.uid || decoded.user_id;
      email = decoded.email;
    } catch (error) {
      console.error('Error parsing token payload:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectMongoDB();

    // Find the user
    const user = await User.findOne({ uid });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'owner') {
      return NextResponse.json(
        { error: 'User is not an owner' },
        { status: 403 }
      );
    }

    // Check if owner is verified by admin
    if (user.verificationStatus !== 'approved' || !user.isVerifiedByAdmin) {
      return NextResponse.json(
        { 
          error: 'Account not verified', 
          message: 'Your account must be verified by an administrator before you can add turfs. Please wait for admin approval.',
          verificationStatus: user.verificationStatus 
        },
        { status: 403 }
      );
    }

    // Get the request body
    const body = await request.json();
    const {
      name,
      description,
      images,
      sportsOffered,
      customSport,
      amenities,
      availableSlots,
      pricing,
      location,
      upiQrCode
    } = body;

    // Validate required fields
    if (!name || !description || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'Name, description, and at least one image are required' },
        { status: 400 }
      );
    }

    if (!sportsOffered || sportsOffered.length === 0) {
      return NextResponse.json(
        { error: 'At least one sport must be selected' },
        { status: 400 }
      );
    }

    if (!availableSlots || availableSlots.length === 0) {
      return NextResponse.json(
        { error: 'At least one time slot is required' },
        { status: 400 }
      );
    }

    if (!pricing || pricing <= 0) {
      return NextResponse.json(
        { error: 'Valid pricing is required' },
        { status: 400 }
      );
    }

    if (!upiQrCode || !upiQrCode.url) {
      return NextResponse.json(
        { error: 'UPI QR code is required' },
        { status: 400 }
      );
    }

    // Create new turf (allow multiple turfs per owner)
    const newTurf = new Turf({
      ownerId: user._id,
      ownerUid: uid,
      name,
      description,
      images,
      featuredImage: images[0].url, // First image as featured
      sportsOffered,
      customSport: sportsOffered.includes('Other') ? customSport : undefined,
      amenities: amenities || [],
      availableSlots,
      pricing,
      location: location || {},
      contactInfo: {
        phone: user.phone || '',
        email: user.email,
        businessName: user.businessName || name
      },
      paymentInfo: {
        upiQrCode
      },
      isActive: true
    });

    await newTurf.save();

    return NextResponse.json({
      message: 'Turf created successfully',
      turf: newTurf
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating turf:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

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
    
    // Verify the Firebase ID token and get UID
    let uid: string;
    try {
      const [, payload] = idToken.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      uid = decoded.uid || decoded.user_id;
    } catch (error) {
      console.error('Error parsing token payload:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectMongoDB();

    // Find the user and their turf
    const user = await User.findOne({ uid });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'owner') {
      return NextResponse.json(
        { error: 'User is not an owner' },
        { status: 403 }
      );
    }

    // Check if owner is verified by admin
    if (user.verificationStatus !== 'approved' || !user.isVerifiedByAdmin) {
      return NextResponse.json(
        { 
          error: 'Account not verified', 
          message: 'Your account must be verified by an administrator before you can update turfs.',
          verificationStatus: user.verificationStatus 
        },
        { status: 403 }
      );
    }

    // Get the request body
    const body = await request.json();
    const {
      turfId,
      name,
      description,
      images,
      sportsOffered,
      customSport,
      amenities,
      availableSlots,
      pricing,
      location,
      upiQrCode
    } = body;

    if (!turfId) {
      return NextResponse.json(
        { error: 'Turf ID is required for updates' },
        { status: 400 }
      );
    }

    // Find existing turf - ensure it belongs to this owner
    const existingTurf = await Turf.findOne({ _id: turfId, ownerUid: uid });
    if (!existingTurf) {
      return NextResponse.json(
        { error: 'Turf not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    // Update turf
    const updatedTurf = await Turf.findOneAndUpdate(
      { _id: turfId, ownerUid: uid },
      {
        name,
        description,
        images,
        featuredImage: images && images.length > 0 ? images[0].url : existingTurf.featuredImage,
        sportsOffered,
        customSport: sportsOffered && sportsOffered.includes('Other') ? customSport : undefined,
        amenities: amenities || [],
        availableSlots,
        pricing,
        location: location || {},
        contactInfo: {
          phone: user.phone || existingTurf.contactInfo.phone,
          email: user.email,
          businessName: user.businessName || name || existingTurf.contactInfo.businessName
        },
        paymentInfo: {
          upiQrCode: upiQrCode || existingTurf.paymentInfo.upiQrCode
        }
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: 'Turf updated successfully',
      turf: updatedTurf
    });

  } catch (error: any) {
    console.error('Error updating turf:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
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
    
    // Verify the Firebase ID token and get UID
    let uid: string;
    try {
      const [, payload] = idToken.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      uid = decoded.uid || decoded.user_id;
    } catch (error) {
      console.error('Error parsing token payload:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectMongoDB();

    // Find all turfs for this owner
    const turfs = await Turf.find({ ownerUid: uid }).populate('ownerId').sort({ createdAt: -1 });
    
    return NextResponse.json({
      turfs,
      count: turfs.length
    });

  } catch (error: any) {
    console.error('Error fetching turf:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    
    // Verify the Firebase ID token and get UID
    let uid: string;
    try {
      const [, payload] = idToken.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      uid = decoded.uid || decoded.user_id;
    } catch (error) {
      console.error('Error parsing token payload:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectMongoDB();

    // Find the user
    const user = await User.findOne({ uid });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'owner') {
      return NextResponse.json(
        { error: 'User is not an owner' },
        { status: 403 }
      );
    }

    // Check if owner is verified by admin
    if (user.verificationStatus !== 'approved' || !user.isVerifiedByAdmin) {
      return NextResponse.json(
        { 
          error: 'Account not verified', 
          message: 'Your account must be verified by an administrator before you can delete turfs.',
          verificationStatus: user.verificationStatus 
        },
        { status: 403 }
      );
    }

    // Get turfId from request body
    const body = await request.json();
    const { turfId } = body;

    if (!turfId) {
      return NextResponse.json(
        { error: 'Turf ID is required' },
        { status: 400 }
      );
    }

    // Delete turf - ensure it belongs to this owner
    const deletedTurf = await Turf.findOneAndDelete({ _id: turfId, ownerUid: uid });
    
    if (!deletedTurf) {
      return NextResponse.json(
        { error: 'Turf not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Turf deleted successfully',
      turfId: deletedTurf._id
    });

  } catch (error: any) {
    console.error('Error deleting turf:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}