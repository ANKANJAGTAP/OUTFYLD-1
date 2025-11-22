import { NextRequest, NextResponse } from 'next/server';
// import connectDB from '@/lib/mongodb';
import JobApplication from '@/app/models/JobApplication';
import Job from '@/app/models/Job';
import { sendApplicationConfirmationEmail, sendNewApplicationNotificationToAdmin } from '@/lib/careerEmails';

// Tell Next.js this route should be dynamic
export const dynamic = 'force-dynamic';

/**
 * POST /api/careers/applications
 * Submit a job application
 */
export async function POST(request: NextRequest) {
  try {
    // connectDB(); // Mongoose models handle connection automatically

    const body = await request.json();
    const {
      jobId,
      userId,
      fullName,
      email,
      phone,
      resume,
      coverLetter,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      college,
      branch,
      graduationYear,
      availability,
      gender,
      disabilityStatus,
      veteranStatus,
      workExperience,
      source
    } = body;

    // Validation
    if (!jobId || !fullName || !email || !phone || !resume || !linkedinUrl || !githubUrl || !gender || !disabilityStatus) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields (job, name, email, phone, resume, LinkedIn URL, GitHub URL, gender, disability status)' 
        },
        { status: 400 }
      );
    }

    // Check if job exists and is open
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Job not found' 
        },
        { status: 404 }
      );
    }

    if (job.status !== 'open') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'This job is no longer accepting applications' 
        },
        { status: 400 }
      );
    }

    // Check if deadline has passed
    if (job.deadline && new Date(job.deadline) < new Date()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Application deadline has passed' 
        },
        { status: 400 }
      );
    }

    // Get IP and User Agent for metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create application
    const application = await JobApplication.create({
      jobId,
      userId: userId || undefined,
      fullName,
      email,
      phone,
      resume,
      coverLetter,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      college,
      branch,
      graduationYear,
      availability,
      gender,
      disabilityStatus,
      veteranStatus,
      workExperience,
      status: 'submitted',
      source: source || 'website',
      ipAddress,
      userAgent,
    });

    // Send confirmation email to applicant
    try {
      await sendApplicationConfirmationEmail(
        email,
        fullName,
        job.title,
        application._id.toString()
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the application if email fails
    }

    // Send notification email to admin
    try {
      await sendNewApplicationNotificationToAdmin(
        job.title,
        fullName,
        email,
        application._id.toString()
      );
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // Don't fail the application if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: application._id,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting application:', error);

    // Handle duplicate application error
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'You have already applied for this position' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to submit application' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/careers/applications
 * Get all applications (admin only) or user's applications
 * Query params: userId, jobId, status
 */
export async function GET(request: NextRequest) {
  try {
    // connectDB(); // Mongoose models handle connection automatically

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');

    // Build query
    const query: any = {};
    
    if (userId) {
      query.userId = userId;
    }
    
    if (jobId) {
      query.jobId = jobId;
    }
    
    if (status) {
      query.status = status;
    }

    // Fetch applications
    const applications = await JobApplication.find(query)
      .populate('jobId', 'title department employmentType location')
      .populate('userId', 'name email')
      .sort({ appliedDate: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      applications,
      count: applications.length
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch applications' 
      },
      { status: 500 }
    );
  }
}
