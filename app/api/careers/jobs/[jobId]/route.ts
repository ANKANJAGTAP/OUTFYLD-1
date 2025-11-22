import { NextRequest, NextResponse } from 'next/server';
// import connectDB from '@/lib/mongodb';
import Job from '@/app/models/Job';

// Tell Next.js this route should be dynamic
export const dynamic = 'force-dynamic';

/**
 * GET /api/careers/jobs/[jobId]
 * Get a single job by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // connectDB(); // Mongoose models handle connection automatically

    const job = await Job.findById(params.jobId)
      .populate('postedBy', 'name email')
      .lean();

    if (!job) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Job not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job
    });

  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch job details' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/careers/jobs/[jobId]
 * Update a job (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // connectDB(); // Mongoose models handle connection automatically

    const body = await request.json();

    const job = await Job.findByIdAndUpdate(
      params.jobId,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!job) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Job not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully',
      job
    });

  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update job' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/careers/jobs/[jobId]
 * Delete a job (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // connectDB(); // Mongoose models handle connection automatically

    const job = await Job.findByIdAndDelete(params.jobId);

    if (!job) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Job not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete job' 
      },
      { status: 500 }
    );
  }
}
