import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Job from '@/app/models/Job';
// Import User model to ensure it's registered for population
import '@/app/models/User';

// Tell Next.js this route should be dynamic
export const dynamic = 'force-dynamic';

/**
 * GET /api/careers/jobs
 * Get all open job listings (public route)
 * Query params: department, employmentType, status
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB first
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const employmentType = searchParams.get('employmentType');
    const status = searchParams.get('status') || 'open'; // Default to open jobs

    // Build query
    const query: any = { status };
    
    if (department) {
      query.department = department;
    }
    
    if (employmentType) {
      query.employmentType = employmentType;
    }

    // Fetch jobs
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
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch jobs' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/careers/jobs
 * Create a new job posting (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB first
    await connectMongoDB();

    const body = await request.json();
    const {
      title,
      department,
      location,
      employmentType,
      description,
      responsibilities,
      requirements,
      salaryRange,
      openings,
      deadline,
      status,
      postedBy
    } = body;

    // Validation
    if (!title || !department || !location || !employmentType || !description || !postedBy) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields' 
        },
        { status: 400 }
      );
    }

    // Create job
    const job = await Job.create({
      title,
      department,
      location,
      employmentType,
      description,
      responsibilities: responsibilities || [],
      requirements: requirements || [],
      salaryRange,
      openings: openings || 1,
      deadline,
      status: status || 'draft',
      postedBy
    });

    return NextResponse.json({
      success: true,
      message: 'Job created successfully',
      job
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create job' 
      },
      { status: 500 }
    );
  }
}
