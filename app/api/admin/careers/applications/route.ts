import { NextRequest, NextResponse } from 'next/server';
import JobApplication from '@/app/models/JobApplication';
import Job from '@/app/models/Job';
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

// Verify admin middleware
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Unauthorized - No token provided', status: 401 };
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const user = await User.findOne({ uid: decodedToken.uid });
    
    if (!user || user.role !== 'admin') {
      return { error: 'Forbidden - Admin access required', status: 403 };
    }
    
    return { user };
  } catch (error) {
    return { error: 'Unauthorized - Invalid token', status: 401 };
  }
}

/**
 * GET /api/admin/careers/applications
 * Get all job applications with filters (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');
    const search = searchParams.get('search'); // Search by name or email
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    const query: any = {};
    if (jobId) query.jobId = jobId;
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch applications with pagination
    const [applications, total] = await Promise.all([
      JobApplication.find(query)
        .populate('jobId', 'title department employmentType status')
        .populate('reviewedBy', 'name email')
        .sort({ appliedDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JobApplication.countDocuments(query)
    ]);

    return NextResponse.json({
      success: true,
      applications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
