import { NextRequest, NextResponse } from 'next/server';
import JobApplication from '@/app/models/JobApplication';
import Job from '@/app/models/Job';
import User from '@/app/models/User';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';
import { sendShortlistNotificationEmail } from '@/lib/careerEmails';
import { generateOfferLetterId } from '@/lib/pdfGenerator';

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
 * POST /api/admin/careers/applications/[id]/send-shortlist
 * Send shortlist notification email (Stage 1 - without accept button)
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
      .populate('jobId', 'title department location stipend');
      
    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if already sent shortlist email
    if (application.status === 'shortlisted_email_sent' || application.status === 'offer_sent' || application.status === 'offer_accepted') {
      return NextResponse.json(
        { success: false, error: 'Shortlist email already sent to this candidate' },
        { status: 400 }
      );
    }

    const job = application.jobId as any;

    // Generate offer letter ID if it doesn't exist
    let offerLetterId = application.offerLetterId;
    if (!offerLetterId) {
      offerLetterId = generateOfferLetterId();
    }

    // Send shortlist notification email (without accept button)
    await sendShortlistNotificationEmail(
      application.email,
      application.fullName,
      job.title,
      job.department,
      job.location,
      offerLetterId
    );

    // Update application status to 'shortlisted_email_sent'
    await JobApplication.findByIdAndUpdate(params.id, {
      status: 'shortlisted_email_sent',
      offerLetterId: offerLetterId,
      reviewedBy: authResult.user._id,
      reviewedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `Shortlist notification email sent to ${application.fullName}`,
      offerLetterId
    });

  } catch (error: any) {
    console.error('Error sending shortlist notification:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send shortlist notification' },
      { status: 500 }
    );
  }
}
