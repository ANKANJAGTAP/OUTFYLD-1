import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

/**
 * POST /api/owner/subscription
 * Submit subscription plan selection and payment screenshot
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerUid, subscriptionPlan, paymentScreenshot } = body;

    // Validate required fields
    if (!ownerUid) {
      return NextResponse.json(
        { error: 'Owner UID is required' },
        { status: 400 }
      );
    }

    if (!subscriptionPlan || !['basic', 'premium'].includes(subscriptionPlan)) {
      return NextResponse.json(
        { error: 'Valid subscription plan is required (basic or premium)' },
        { status: 400 }
      );
    }

    if (!paymentScreenshot || !paymentScreenshot.url || !paymentScreenshot.public_id) {
      return NextResponse.json(
        { error: 'Payment screenshot is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectMongoDB();

    // Find the owner
    const owner = await User.findOne({ uid: ownerUid });
    if (!owner) {
      return NextResponse.json(
        { error: 'Owner not found' },
        { status: 404 }
      );
    }

    if (owner.role !== 'owner') {
      return NextResponse.json(
        { error: 'User is not a turf owner' },
        { status: 400 }
      );
    }

    // Set subscription amount based on plan
    const subscriptionAmount = subscriptionPlan === 'basic' ? 1000 : 2000;

    // Update owner with subscription details
    owner.subscriptionPlan = subscriptionPlan;
    owner.subscriptionAmount = subscriptionAmount;
    owner.paymentScreenshot = paymentScreenshot;
    owner.verificationStatus = 'pending'; // Set to pending for admin approval
    owner.isVerifiedByAdmin = false;
    owner.paymentVerified = false;

    await owner.save();

    return NextResponse.json({
      success: true,
      message: 'Subscription submitted successfully. Awaiting admin approval.',
      owner: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        subscriptionPlan: owner.subscriptionPlan,
        subscriptionAmount: owner.subscriptionAmount,
        verificationStatus: owner.verificationStatus
      }
    });

  } catch (error: any) {
    console.error('Error submitting subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/owner/subscription?uid=<owner_uid>
 * Get owner's subscription details
 */
export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'Owner UID is required' },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const owner = await User.findOne({ uid });
    if (!owner) {
      return NextResponse.json(
        { error: 'Owner not found' },
        { status: 404 }
      );
    }

    if (owner.role !== 'owner') {
      return NextResponse.json(
        { error: 'User is not a turf owner' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: {
        subscriptionPlan: owner.subscriptionPlan,
        subscriptionAmount: owner.subscriptionAmount,
        paymentScreenshot: owner.paymentScreenshot,
        verificationStatus: owner.verificationStatus,
        isVerifiedByAdmin: owner.isVerifiedByAdmin,
        paymentVerified: owner.paymentVerified,
        rejectionReason: owner.rejectionReason
      }
    });

  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
