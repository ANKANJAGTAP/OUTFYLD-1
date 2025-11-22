import { NextRequest, NextResponse } from 'next/server';
import JobApplication from '@/app/models/JobApplication';
import Job from '@/app/models/Job';
import User from '@/app/models/User';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';
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
 * GET /api/admin/careers/applications/export
 * Export applications as CSV (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');

    // Build query
    const query: any = {};
    if (jobId) query.jobId = jobId;
    if (status) query.status = status;

    // Fetch all applications matching query
    const applications = await JobApplication.find(query)
      .populate('jobId', 'title department employmentType location')
      .sort({ appliedDate: -1 })
      .lean();

    if (applications.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No applications found to export' },
        { status: 404 }
      );
    }

    // Generate CSV with ALL fields
    const csvHeaders = [
      'Application Date',
      'Job Title',
      'Department',
      'Employment Type',
      'Job Location',
      'Full Name',
      'Email',
      'Phone',
      'College',
      'Branch',
      'Graduation Year',
      'Availability',
      'Resume URL',
      'Resume File Name',
      'Cover Letter',
      'LinkedIn',
      'GitHub',
      'Portfolio',
      'Gender',
      'Disability Status',
      'Veteran Status',
      'Work Experience',
      'Status',
      'Applied Via',
      'Offer Letter ID',
      'Offer Accepted',
      'Offer Accepted At',
      'Offer Expiry Date',
      'Signature Data URL',
      'Payment Status',
      'Payment Amount',
      'Payment Transaction ID',
      'Payment Date',
      'Admin Notes',
      'Reviewed By',
      'Reviewed At'
    ];

    const csvRows = applications.map((app: any) => {
      const job = app.jobId || {};
      
      // Format work experience if exists
      let workExpStr = '';
      if (app.workExperience && Array.isArray(app.workExperience) && app.workExperience.length > 0) {
        workExpStr = app.workExperience.map((exp: any) => 
          `${exp.company || 'N/A'} - ${exp.role || 'N/A'} (${exp.duration || 'N/A'}): ${exp.description || ''}`
        ).join(' | ');
      }
      
      return [
        app.appliedDate ? format(new Date(app.appliedDate), 'dd/MM/yyyy HH:mm') : '',
        job.title || '',
        job.department || '',
        job.employmentType || '',
        job.location || '',
        app.fullName || '',
        app.email || '',
        app.phone || '',
        app.college || '',
        app.branch || '',
        app.graduationYear || '',
        app.availability || '',
        app.resume?.url || '',
        app.resume?.fileName || '',
        app.coverLetter || '',
        app.linkedinUrl || '',
        app.githubUrl || '',
        app.portfolioUrl || '',
        app.gender || '',
        app.disabilityStatus || '',
        app.veteranStatus || '',
        workExpStr,
        app.status || '',
        app.source || '',
        app.offerLetterId || '',
        app.offerAccepted ? 'Yes' : 'No',
        app.offerAcceptedAt ? format(new Date(app.offerAcceptedAt), 'dd/MM/yyyy HH:mm') : '',
        app.offerExpiryDate ? format(new Date(app.offerExpiryDate), 'dd/MM/yyyy') : '',
        app.signatureDataUrl ? 'Yes' : 'No',
        app.paymentStatus || '',
        app.paymentAmount || '',
        app.paymentTransactionId || '',
        app.paymentDate ? format(new Date(app.paymentDate), 'dd/MM/yyyy HH:mm') : '',
        app.adminNotes || '',
        app.reviewedBy?.name || '',
        app.reviewedAt ? format(new Date(app.reviewedAt), 'dd/MM/yyyy HH:mm') : ''
      ].map(field => {
        // Escape double quotes and wrap in quotes if contains comma
        const escaped = String(field).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      }).join(',');
    });

    const csv = [csvHeaders.join(','), ...csvRows].join('\n');

    // Return CSV file
    const filename = jobId 
      ? `applications_job_${jobId}_${format(new Date(), 'yyyyMMdd')}.csv`
      : `all_applications_${format(new Date(), 'yyyyMMdd')}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting applications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export applications' },
      { status: 500 }
    );
  }
}
