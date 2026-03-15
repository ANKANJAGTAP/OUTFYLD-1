import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';
import Settings from '@/app/models/Settings';
import SubscriptionPayment from '@/app/models/SubscriptionPayment';
import { createOrder } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

// Default plan config (used if Settings document doesn't exist)
const DEFAULT_PLANS = {
  starter: { name: 'Starter Plan', price: 1500, durationMonths: 6, maxTurfs: 1 },
  pro: { name: 'Pro Plan', price: 2000, durationMonths: 12, maxTurfs: 3 },
};

/**
 * POST /api/owner/subscription
 * Create a Razorpay order for subscription payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerUid, plan } = body;

    if (!ownerUid) {
      return NextResponse.json({ error: 'Owner UID is required' }, { status: 400 });
    }

    if (!plan || !['starter', 'pro'].includes(plan)) {
      return NextResponse.json(
        { error: 'Valid plan is required (starter or pro)' },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Find the owner
    const owner = await User.findOne({ uid: ownerUid });
    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    if (owner.role !== 'owner') {
      return NextResponse.json({ error: 'User is not a turf owner' }, { status: 400 });
    }

    // Get plan details from Settings or use defaults
    let planConfig;
    const planKey = plan as keyof typeof DEFAULT_PLANS;
    try {
      const settings = await Settings.findOne({});
      planConfig = settings?.subscriptionPlans?.[planKey] || DEFAULT_PLANS[planKey];
    } catch {
      planConfig = DEFAULT_PLANS[planKey];
    }

    const amount = planConfig.price;
    const durationMonths = planConfig.durationMonths;

    // Check if this is an upgrade
    const isUpgrade = owner.subscriptionPlan === 'starter' && plan === 'pro';

    // Create Razorpay order
    const receipt = `sub_${ownerUid.slice(-8)}_${Date.now()}`;
    const order = await createOrder(amount, 'INR', receipt, {
      ownerUid,
      plan,
      type: 'subscription',
    });

    // Create SubscriptionPayment record
    await SubscriptionPayment.create({
      ownerUid,
      ownerId: owner._id,
      plan,
      amount,
      durationMonths,
      razorpayOrderId: order.id,
      paymentStatus: 'pending',
      isUpgrade,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount,
      currency: 'INR',
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      planName: planConfig.name,
      durationMonths,
      prefill: {
        name: owner.name,
        email: owner.email,
        contact: owner.phone || '',
      },
    });
  } catch (error: any) {
    console.error('Error creating subscription order:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
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
      return NextResponse.json({ error: 'Owner UID is required' }, { status: 400 });
    }

    await connectMongoDB();

    const owner = await User.findOne({ uid });
    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    if (owner.role !== 'owner') {
      return NextResponse.json({ error: 'User is not a turf owner' }, { status: 400 });
    }

    // Check if subscription has expired
    let subscriptionStatus = owner.subscriptionStatus || 'none';
    if (
      subscriptionStatus === 'active' &&
      owner.subscriptionEndDate &&
      new Date(owner.subscriptionEndDate) < new Date()
    ) {
      subscriptionStatus = 'expired';
      owner.subscriptionStatus = 'expired';
      await owner.save();
    }

    // Get plan config
    let planConfig = null;
    if (owner.subscriptionPlan) {
      try {
        const settings = await Settings.findOne({});
        const planKey = owner.subscriptionPlan === 'basic' ? 'starter' : 
                       owner.subscriptionPlan === 'premium' ? 'pro' : 
                       owner.subscriptionPlan;
        planConfig = settings?.subscriptionPlans?.[planKey] || DEFAULT_PLANS[planKey as keyof typeof DEFAULT_PLANS];
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        subscriptionPlan: owner.subscriptionPlan,
        subscriptionAmount: owner.subscriptionAmount,
        subscriptionStartDate: owner.subscriptionStartDate,
        subscriptionEndDate: owner.subscriptionEndDate,
        subscriptionStatus,
        verificationStatus: owner.verificationStatus,
        isVerifiedByAdmin: owner.isVerifiedByAdmin,
        paymentVerified: owner.paymentVerified,
        bankDetailsVerified: owner.bankDetailsVerified,
        rejectionReason: owner.rejectionReason,
        planConfig,
      },
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}
