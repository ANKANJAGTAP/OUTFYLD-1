import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Turf from '@/app/models/Turf';
import User from '@/app/models/User';
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

    // 3. Fetch all active turfs
    let turfs = await Turf.find({ isActive: true })
        .sort({ createdAt: -1 })
        .lean();

    // 4. Manually populate owner details to avoid populate type mismatch issues
    const userIds = turfs.map((t: any) => t.ownerId);
    const users = await User.find({ _id: { $in: userIds } }).lean();
    
    // Also fetch by ownerUid as fallback for older records
    const uids = turfs.map((t: any) => t.ownerUid);
    const usersByUid = await User.find({ uid: { $in: uids } }).lean();

    // Attach users back to turfs
    turfs = turfs.map((turf: any) => {
      let owner = users.find((u: any) => u._id.toString() === turf.ownerId?.toString());
      if (!owner && turf.ownerUid) {
        owner = usersByUid.find((u: any) => u.uid === turf.ownerUid);
      }
      return {
        ...turf,
        ownerId: owner || null
      };
    });

    // 5. Get aggregate bookings data for these turfs
    const turfIds = turfs.map((t: any) => t._id);
    const Booking = (await import('@/app/models/Booking')).default;
    
    const bookingsAggregation = await Booking.aggregate([
      {
        $match: {
          turfId: { $in: turfIds },
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: '$turfId',
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Map the aggregations back to the turfs
    turfs = turfs.map((turf: any) => {
      const stats = bookingsAggregation.find(b => b._id.toString() === turf._id.toString()) || { totalBookings: 0, totalRevenue: 0 };
      return {
        ...turf,
        totalBookings: stats.totalBookings,
        totalRevenue: stats.totalRevenue
      };
    });

    return NextResponse.json({
      success: true,
      turfs,
      count: turfs.length
    });

  } catch (error: any) {
    console.error('Error fetching admin turfs:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
