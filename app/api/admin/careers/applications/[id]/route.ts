import { NextRequest, NextResponse } from 'next/server';
import JobApplication from '@/app/models/JobApplication';
import Job from '@/app/models/Job';
import User from '@/app/models/User';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';
import { sendShortlistedEmail, sendRejectionEmail } from '@/lib/careerEmails';
import { generateOfferLetterPDF, generateOfferLetterId } from '@/lib/pdfGenerator';
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
 * GET /api/admin/careers/applications/[id]
 * Get single application details (admin only)
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

    const application = await JobApplication.findById(params.id)
      .populate('jobId', 'title department employmentType location status')
      .populate('reviewedBy', 'name email')
      .lean();

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application
    });

  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/careers/applications/[id]
 * Update application status and notes (admin only)
 * If status changes to 'rejected', delete resume from Cloudinary
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
    const { status, adminNotes } = body;

    // Find existing application
    const application = await JobApplication.findById(params.id);
    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    const previousStatus = application.status;

    // Update application
    const updateData: any = {
      reviewedBy: authResult.user._id,
      reviewedAt: new Date()
    };

    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const updatedApplication = await JobApplication.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('jobId', 'title department employmentType location stipend');

    // If status changed to 'rejected', delete resume from Cloudinary
    if (status === 'rejected' && previousStatus !== 'rejected' && application.resume?.public_id) {
      try {
        await cloudinary.uploader.destroy(application.resume.public_id, {
          resource_type: 'raw'
        });
        console.log(`✅ Deleted resume from Cloudinary: ${application.resume.public_id}`);
      } catch (cloudinaryError) {
        console.error('❌ Failed to delete resume from Cloudinary:', cloudinaryError);
        // Don't fail the request if Cloudinary deletion fails
      }

      // Send rejection email
      try {
        await sendRejectionEmail(
          application.email,
          application.fullName,
          updatedApplication.jobId.title,
          application._id.toString()
        );
      } catch (emailError) {
        console.error('❌ Failed to send rejection email:', emailError);
      }
    }

    // If status changed to 'shortlisted', send shortlisted email
    if (status === 'shortlisted' && previousStatus !== 'shortlisted') {
      try {
        const job = updatedApplication.jobId as any;
        
        // Generate Offer Letter ID
        const offerLetterId = generateOfferLetterId();
        
        // Set expiry date (7 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        
        // Calculate internship duration (example: 2 months from now)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 14); // Start in 2 weeks
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 2); // 2 months duration
        
        // Generate Offer Letter PDF
        const offerLetterPdf = await generateOfferLetterPDF({
          candidateName: application.fullName,
          offerLetterId: offerLetterId,
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
        
        // Update application with offer letter details
        await JobApplication.findByIdAndUpdate(params.id, {
          offerLetterId: offerLetterId,
          offerLetterGeneratedAt: new Date(),
          offerLetterPdfUrl: offerLetterPdf.url,
          offerAcceptanceStatus: 'pending',
          offerExpiryDate: expiryDate,
          internshipStartDate: startDate,
          internshipEndDate: endDate
        });
        
        // Send shortlisted email with offer letter ID
        await sendShortlistedEmail(
          application.email,
          application.fullName,
          job.title,
          job.department,
          job.location,
          job.stipend.amount,
          job.stipend.type,
          application._id.toString(),
          offerLetterId
        );
        
        console.log(`✅ Offer letter generated: ${offerLetterId}`);
        
      } catch (emailError) {
        console.error('❌ Failed to send shortlisted email or generate offer letter:', emailError);
        // Don't fail the entire request, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application updated successfully',
      application: updatedApplication
    });

  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update application' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/careers/applications/[id]
 * Delete an application (admin only)
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

    // Find the application
    const application = await JobApplication.findById(params.id);
    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Delete resume from Cloudinary if exists
    if (application.resume?.public_id) {
      try {
        await cloudinary.uploader.destroy(application.resume.public_id, {
          resource_type: 'raw'
        });
        console.log(`✅ Deleted resume from Cloudinary: ${application.resume.public_id}`);
      } catch (cloudinaryError) {
        console.error('❌ Failed to delete resume from Cloudinary:', cloudinaryError);
      }
    }

    // Delete the application
    await JobApplication.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete application' },
      { status: 500 }
    );
  }
}
