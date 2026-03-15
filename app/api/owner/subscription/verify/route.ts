import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';
import Turf from '@/app/models/Turf';
import SubscriptionPayment from '@/app/models/SubscriptionPayment';
import { verifyPaymentSignature } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

/**
 * POST /api/owner/subscription/verify
 * Verify Razorpay payment after checkout and auto-approve the owner
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      ownerUid,
    } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !ownerUid) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Payment verification failed — invalid signature' },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Find the subscription payment record
    const subscriptionPayment = await SubscriptionPayment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!subscriptionPayment) {
      return NextResponse.json(
        { error: 'Subscription payment record not found' },
        { status: 404 }
      );
    }

    if (subscriptionPayment.paymentStatus === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
      });
    }

    // Update subscription payment record
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + subscriptionPayment.durationMonths);

    subscriptionPayment.razorpayPaymentId = razorpay_payment_id;
    subscriptionPayment.razorpaySignature = razorpay_signature;
    subscriptionPayment.paymentStatus = 'paid';
    subscriptionPayment.subscriptionStartDate = now;
    subscriptionPayment.subscriptionEndDate = endDate;
    await subscriptionPayment.save();

    // Update owner user document — auto-approve
    const owner = await User.findOne({ uid: ownerUid });
    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    owner.subscriptionPlan = subscriptionPayment.plan;
    owner.subscriptionAmount = subscriptionPayment.amount;
    owner.subscriptionStartDate = now;
    owner.subscriptionEndDate = endDate;
    owner.subscriptionStatus = 'active';
    owner.razorpaySubscriptionOrderId = razorpay_order_id;
    owner.razorpaySubscriptionPaymentId = razorpay_payment_id;
    owner.verificationStatus = 'approved';
    owner.isVerifiedByAdmin = true;
    owner.paymentVerified = true;
    owner.paymentDetails = {
      amount: subscriptionPayment.amount,
      date: now,
      transactionId: razorpay_payment_id,
      method: 'Razorpay',
    };
    owner.verifiedAt = now;

    await owner.save();

    // If this is an upgrade, re-activate any hidden turfs (they may have been hidden during expiry)
    if (subscriptionPayment.isUpgrade) {
      await Turf.updateMany(
        { ownerUid: ownerUid, isActive: false },
        { $set: { isActive: true } }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription payment verified successfully! Your account is now active.',
      subscription: {
        plan: subscriptionPayment.plan,
        amount: subscriptionPayment.amount,
        startDate: now,
        endDate,
        status: 'active',
      },
    });
  } catch (error: any) {
    console.error('Error verifying subscription payment:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}
