import { NextRequest, NextResponse } from 'next/server';
import JobApplication from '@/app/models/JobApplication';
import { connectMongoDB } from '@/lib/mongodb';
import Razorpay from 'razorpay';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * POST /api/careers/accept-offer/payment
 * Create Razorpay order for onboarding payment
 */
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { applicationId, amount } = body;

    if (!applicationId || !amount) {
      return NextResponse.json(
        { error: 'Application ID and amount are required' },
        { status: 400 }
      );
    }

    const application = await JobApplication.findById(applicationId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if offer has expired
    if (application.offerExpiryDate && new Date() > new Date(application.offerExpiryDate)) {
      return NextResponse.json(
        { error: 'This offer has expired' },
        { status: 410 }
      );
    }

    // Check if already paid
    if (application.paymentStatus === 'completed') {
      return NextResponse.json(
        { error: 'Payment already completed for this application' },
        { status: 400 }
      );
    }

    // Check if signature exists
    if (!application.signatureUrl) {
      return NextResponse.json(
        { error: 'Please complete the signature step first' },
        { status: 400 }
      );
    }

    // Check payment attempts (max 20)
    const currentAttempts = application.paymentAttempts || 0;
    if (currentAttempts >= 20) {
      return NextResponse.json(
        { error: 'Maximum payment attempts (20) exceeded. Please contact HR at hr@outfyld.in for assistance.' },
        { status: 403 }
      );
    }

    // Create Razorpay order
    const timestamp = Date.now();
    const shortId = applicationId.toString().slice(-8); // Last 8 chars of application ID
    const options = {
      amount: amount * 100, // Amount in paise (249 * 100 = 24900 paise)
      currency: 'INR',
      receipt: `OFR${shortId}${timestamp}`.slice(0, 40), // Max 40 chars
      notes: {
        applicationId: applicationId,
        candidateName: application.fullName,
        candidateEmail: application.email,
        offerLetterId: application.offerLetterId,
        purpose: 'Onboarding Fee + Digital Certificate'
      }
    };

    const order = await razorpay.orders.create(options);

    // Update payment attempt
    await JobApplication.findByIdAndUpdate(applicationId, {
      $inc: { paymentAttempts: 1 },
      paymentStatus: 'pending'
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      applicationId: applicationId
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
