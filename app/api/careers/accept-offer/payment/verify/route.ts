import { NextRequest, NextResponse } from 'next/server';
import JobApplication from '@/app/models/JobApplication';
import { connectMongoDB } from '@/lib/mongodb';
import crypto from 'crypto';
import { generateJoiningLetterPDF, generatePaymentReceiptPDF } from '@/lib/pdfGenerator';
import { sendJoiningLetterEmail } from '@/lib/careerEmails';

/**
 * POST /api/careers/accept-offer/payment/verify
 * Verify Razorpay payment signature and complete onboarding
 */
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { applicationId, paymentId, orderId, signature } = body;

    if (!applicationId || !paymentId || !orderId || !signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification parameters' },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature. Payment verification failed.' },
        { status: 400 }
      );
    }

    const application = await JobApplication.findById(applicationId).populate('jobId');

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Generate Joining Letter PDF
    const joiningLetterResult = await generateJoiningLetterPDF({
      candidateName: application.fullName,
      position: application.jobId?.title || 'Intern',
      department: application.jobId?.department || 'Technology',
      startDate: application.internshipStartDate,
      salary: application.jobId?.salary || 0,
      offerLetterId: application.offerLetterId!
    });

    // Generate Payment Receipt PDF
    const paymentDate = new Date();
    const receiptResult = await generatePaymentReceiptPDF({
      candidateName: application.fullName,
      email: application.email,
      offerLetterId: application.offerLetterId!,
      position: application.jobId?.title || 'Intern',
      transactionId: paymentId,
      paymentDate: paymentDate,
      amount: 249
    });

    // Update application with payment details
    await JobApplication.findByIdAndUpdate(applicationId, {
      paymentStatus: 'completed',
      paymentTransactionId: paymentId,
      paymentAmount: 249,
      paymentDate: paymentDate,
      paymentReceiptUrl: receiptResult.url,
      offerAcceptanceStatus: 'accepted',
      status: 'hired',
      joiningLetterPdfUrl: joiningLetterResult.url,
      updatedAt: new Date()
    });

    // Send joining letter email with receipt
    await sendJoiningLetterEmail(
      application.email,
      application.fullName,
      application.jobId?.title || 'Intern',
      application.internshipStartDate,
      joiningLetterResult.url,
      application.offerLetterId!,
      receiptResult.url,
      joiningLetterResult.buffer,
      receiptResult.buffer
    );

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully. Joining letter sent to your email.',
      joiningLetterUrl: joiningLetterResult.url
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
