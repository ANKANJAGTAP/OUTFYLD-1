import { NextRequest, NextResponse } from 'next/server';
import JobApplication from '@/app/models/JobApplication';
import { connectMongoDB } from '@/lib/mongodb';

/**
 * POST /api/careers/accept-offer/verify
 * Verify offer letter ID and update verification details
 */
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { applicationId, offerLetterId, currentAddress, acceptedPosition, preferredStartDate } = body;

    if (!applicationId || !offerLetterId) {
      return NextResponse.json(
        { error: 'Application ID and Offer Letter ID are required' },
        { status: 400 }
      );
    }

    const application: any = await JobApplication.findById(applicationId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Verify offer letter ID matches
    if (application.offerLetterId !== offerLetterId) {
      return NextResponse.json(
        { error: 'Invalid Offer Letter ID. Please check your email for the correct ID.' },
        { status: 400 }
      );
    }

    // Check if offer has expired
    if (application.offerExpiryDate && new Date() > new Date(application.offerExpiryDate)) {
      return NextResponse.json(
        { error: 'This offer has expired. Please contact HR.' },
        { status: 410 }
      );
    }

    // Update application with address and preferred start date if provided
    if (currentAddress) {
      application.currentAddress = currentAddress;
    }
    if (preferredStartDate) {
      application.preferredStartDate = new Date(preferredStartDate);
    }
    if (currentAddress || preferredStartDate) {
      await application.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Verification successful'
    });

  } catch (error) {
    console.error('Error verifying offer:', error);
    return NextResponse.json(
      { error: 'Failed to verify offer letter' },
      { status: 500 }
    );
  }
}
