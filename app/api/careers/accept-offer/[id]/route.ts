import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import JobApplication from '@/app/models/JobApplication';
import Job from '@/app/models/Job';
import { connectMongoDB } from '@/lib/mongodb';

/**
 * GET /api/careers/accept-offer/[id]
 * Fetch application details for offer acceptance
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB();
    
    // Ensure Job model is registered for population
    if (!mongoose.models.Job) {
      Job;
    }

    const application = await JobApplication.findById(params.id)
      .populate('jobId')
      .lean() as any;

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if offer has expired
    if (application.offerExpiryDate && new Date() > new Date(application.offerExpiryDate)) {
      return NextResponse.json(
        { error: 'This offer has expired. Please contact HR.' },
        { status: 410 }
      );
    }

    // Check if already accepted
    if (application.offerAcceptanceStatus === 'accepted') {
      return NextResponse.json(
        { error: 'This offer has already been accepted' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      application: {
        fullName: application.fullName,
        email: application.email,
        phone: application.phone,
        offerLetterId: application.offerLetterId,
        job: application.jobId,
        offerExpiryDate: application.offerExpiryDate
      }
    });

  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application details' },
      { status: 500 }
    );
  }
}
