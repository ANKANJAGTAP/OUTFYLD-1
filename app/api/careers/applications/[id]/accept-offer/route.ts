import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import JobApplication from '@/app/models/JobApplication';

export const dynamic = 'force-dynamic';

/**
 * GET /api/careers/applications/[id]/accept-offer
 * Accept job offer from email link
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB();

    const applicationId = params.id;

    // Find the application
    const application = await JobApplication.findById(applicationId).populate('jobId', 'title');

    if (!application) {
      // Redirect to careers page with error
      return NextResponse.redirect(
        new URL('/careers?error=application-not-found', request.url)
      );
    }

    // Check if already accepted
    if (application.offerAccepted) {
      // Redirect to careers page with already accepted message
      return NextResponse.redirect(
        new URL('/careers?message=offer-already-accepted', request.url)
      );
    }

    // Check if status is shortlisted
    if (application.status !== 'shortlisted') {
      // Redirect to careers page with error
      return NextResponse.redirect(
        new URL('/careers?error=offer-not-available', request.url)
      );
    }

    // Update application to mark offer as accepted
    application.offerAccepted = true;
    application.offerAcceptedAt = new Date();
    await application.save();

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/careers?success=offer-accepted&job=${encodeURIComponent(application.jobId.title)}`, request.url)
    );

  } catch (error) {
    console.error('Error accepting offer:', error);
    return NextResponse.redirect(
      new URL('/careers?error=server-error', request.url)
    );
  }
}
