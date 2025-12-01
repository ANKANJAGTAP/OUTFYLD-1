import { NextRequest, NextResponse } from 'next/server';
import JobApplication from '@/app/models/JobApplication';
import Job from '@/app/models/Job';
import User from '@/app/models/User';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';
import { sendOfferLetterEmail } from '@/lib/careerEmails';
import { generateOfferLetterPDF } from '@/lib/pdfGenerator';
import { format } from 'date-fns';

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
 * POST /api/admin/careers/applications/[id]/send-offer
 * Send offer letter email with accept button (Stage 2)
 */
export async function POST(
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

    // Find the application
    const application = await JobApplication.findById(params.id)
      .populate('jobId', 'title department location employmentType stipend');
      
    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if shortlist email was sent first
    if (application.status !== 'shortlisted_email_sent') {
      return NextResponse.json(
        { success: false, error: 'Please send shortlist notification email first' },
        { status: 400 }
      );
    }

    // Check if offer letter ID exists
    if (!application.offerLetterId) {
      return NextResponse.json(
        { success: false, error: 'Offer letter ID not found. Please send shortlist email first.' },
        { status: 400 }
      );
    }

    const job = application.jobId as any;

    // Set expiry date (7 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    
    // Set fixed internship start date: December 7, 2025
    const startDate = new Date('2025-12-07');
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 2); // 2 months duration
    
    // Generate Offer Letter PDF
    const offerLetterPdf = await generateOfferLetterPDF({
      candidateName: application.fullName,
      offerLetterId: application.offerLetterId,
      jobTitle: job.title,
      department: job.department,
      employmentType: job.employmentType,
      location: job.location,
      stipendAmount: job.stipend.amount,
      stipendType: job.stipend.type,
      startDate: format(startDate, 'dd MMM yyyy'),
      endDate: format(endDate, 'dd MMM yyyy'),
      issueDate: format(new Date(), 'dd/MM/yyyy')
    });

    // Send offer letter email with accept button
    await sendOfferLetterEmail(
      application.email,
      application.fullName,
      job.title,
      job.department,
      job.location,
      job.stipend.amount,
      job.stipend.type,
      application._id.toString(),
      application.offerLetterId
    );

    // Update application with offer letter details and change status to 'offer_sent'
    await JobApplication.findByIdAndUpdate(params.id, {
      status: 'offer_sent',
      offerLetterGeneratedAt: new Date(),
      offerLetterPdfUrl: offerLetterPdf.url,
      offerAcceptanceStatus: 'pending',
      offerExpiryDate: expiryDate,
      internshipStartDate: startDate,
      internshipEndDate: endDate,
      reviewedBy: authResult.user._id,
      reviewedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `Offer letter email sent to ${application.fullName}`,
      offerLetterPdfUrl: offerLetterPdf.url
    });

  } catch (error: any) {
    console.error('Error sending offer letter:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send offer letter' },
      { status: 500 }
    );
  }
}
