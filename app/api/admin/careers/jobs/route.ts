import { NextRequest, NextResponse } from 'next/server';
import Job from '@/app/models/Job';
import User from '@/app/models/User';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';
import { connectMongoDB } from '@/lib/mongodb';

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

/**
 * GET /api/admin/careers/jobs
 * Get all jobs (admin only) - includes draft, open, and closed
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Get Firebase token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await User.findOne({ uid: decodedToken.uid });
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const department = searchParams.get('department');

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (department) query.department = department;

    // Fetch all jobs for admin
    const jobs = await Job.find(query)
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length
    });

  } catch (error) {
    console.error('Error fetching jobs (admin):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/careers/jobs
 * Create a new job posting (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Get Firebase token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await User.findOne({ uid: decodedToken.uid });
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      department,
      location,
      employmentType,
      description,
      responsibilities,
      requirements,
      stipend,
      internshipYear,
      deadline
    } = body;

    // Validation
    if (!title || !department || !location || !employmentType || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!responsibilities || !Array.isArray(responsibilities) || responsibilities.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one responsibility is required' },
        { status: 400 }
      );
    }

    if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one requirement is required' },
        { status: 400 }
      );
    }

    if (!stipend || !stipend.amount || !stipend.type) {
      return NextResponse.json(
        { success: false, error: 'Stipend amount and type are required' },
        { status: 400 }
      );
    }

    // Create job (directly as 'open')
    const job = await Job.create({
      title,
      department,
      location,
      employmentType,
      description,
      responsibilities,
      requirements,
      stipend,
      internshipYear: internshipYear || undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      status: 'open', // Always create as open
      postedBy: user._id
    });

    return NextResponse.json({
      success: true,
      message: 'Job posted successfully',
      job
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create job' },
      { status: 500 }
    );
  }
}
