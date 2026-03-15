import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';
import Turf from '@/app/models/Turf';
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

    // 3. Calculate Platform Analytics
    const [
        totalCustomers,
        totalTurfOwners,
        totalTurfs,
        totalBookings,
        completedBookingsData
    ] = await Promise.all([
        User.countDocuments({ role: 'customer' }),
        User.countDocuments({ role: 'owner' }),
        Turf.countDocuments({ isActive: true }),
        Booking.countDocuments({}),
        Booking.aggregate([
            { $match: { status: 'confirmed' } },
            { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
        ])
    ]);

    const platformRevenue = completedBookingsData.length > 0 ? completedBookingsData[0].totalRevenue : 0;

    return NextResponse.json({
      success: true,
      analytics: {
          totalCustomers,
          totalTurfOwners,
          totalTurfs,
          totalBookings,
          platformRevenue
      }
    });

  } catch (error: any) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
