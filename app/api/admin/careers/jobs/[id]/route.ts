import { NextRequest, NextResponse } from 'next/server';
import Job from '@/app/models/Job';
import User from '@/app/models/User';
import JobApplication from '@/app/models/JobApplication';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';

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

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
 * GET /api/admin/careers/jobs/[id]
 * Get single job details (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const job = await Job.findById(params.id)
      .populate('postedBy', 'name email')
      .lean();

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get application count
    const applicationCount = await JobApplication.countDocuments({ jobId: params.id });

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        applicationCount
      }
    });

  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/careers/jobs/[id]
 * Update a job posting (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const {
      title,
      department,
      location,
      employmentType,
      description,
      requirements,
      stipend,
      internshipYear,
      openings,
      deadline,
      status
    } = body;

    // Find existing job
    const job = await Job.findById(params.id);
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Validation
    if (requirements && (!Array.isArray(requirements) || requirements.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'At least one requirement is required' },
        { status: 400 }
      );
    }

    // Update job
    const updatedJob = await Job.findByIdAndUpdate(
      params.id,
      {
        ...(title && { title }),
        ...(department && { department }),
        ...(location && { location }),
        ...(employmentType && { employmentType }),
        ...(description && { description }),
        ...(requirements && { requirements }),
        ...(stipend && { stipend }),
        ...(internshipYear !== undefined && { internshipYear: internshipYear || undefined }),
        ...(openings && { openings }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(status && { status })
      },
      { new: true, runValidators: true }
    ).populate('postedBy', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully',
      job: updatedJob
    });

  } catch (error: any) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/careers/jobs/[id]
 * Delete a job posting (admin only)
 * NOTE: Does NOT delete resumes from Cloudinary (as per requirements)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Find the job
    const job = await Job.findById(params.id);
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if there are applications
    const applicationCount = await JobApplication.countDocuments({ jobId: params.id });
    
    if (applicationCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete job with ${applicationCount} application(s). Please close the job instead.` 
        },
        { status: 400 }
      );
    }

    // Delete the job (only if no applications)
    await Job.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}
