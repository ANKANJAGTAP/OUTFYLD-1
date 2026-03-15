import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Turf from '@/app/models/Turf';
import User from '@/app/models/User';
import Booking from '@/app/models/Booking';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate the admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);
    
    // Connect to MongoDB first for role verification
    await connectMongoDB();

    // Verify admin role from database
    const user = await User.findOne({ uid: decodedToken.uid });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    // 3. Fetch all active turfs populated with Owner details
    const turfs = await Turf.find({ isActive: true })
        .populate({ path: 'ownerId', model: User, select: 'name email phone businessName verificationStatus subscriptionPlan' })
        .lean()
        .sort({ createdAt: -1 });

    // 4. Fetch booking and revenue stats for each turf
    const turfIds = turfs.map((turf: any) => turf._id);
    
    // Aggregate bookings by turf
    const stats = await Booking.aggregate([
      { $match: { turfId: { $in: turfIds }, status: 'confirmed' } },
      { 
        $group: { 
          _id: '$turfId', 
          totalBookings: { $sum: 1 }, 
          totalRevenue: { $sum: '$totalAmount' } 
        } 
      }
    ]);

    const statsMap = stats.reduce((acc, curr) => {
      acc[curr._id.toString()] = { totalBookings: curr.totalBookings, totalRevenue: curr.totalRevenue };
      return acc;
    }, {});

    const enrichedTurfs = turfs.map((turf: any) => ({
      ...turf,
      totalBookings: statsMap[turf._id.toString()]?.totalBookings || 0,
      totalRevenue: statsMap[turf._id.toString()]?.totalRevenue || 0
    }));

    return NextResponse.json({
      success: true,
      turfs: enrichedTurfs,
      count: enrichedTurfs.length
    });

  } catch (error: any) {
    console.error('Error fetching admin turfs:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
