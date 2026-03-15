import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';
import Turf from '@/app/models/Turf';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/check-subscriptions
 * Check for expired subscriptions and auto-hide their turfs
 * Should be called periodically (e.g., via cron or on admin dashboard load)
 */
export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const now = new Date();

    // Find all owners with expired subscriptions
    const expiredOwners = await User.find({
      role: 'owner',
      subscriptionStatus: 'active',
      subscriptionEndDate: { $lt: now },
    });

    if (expiredOwners.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired subscriptions found',
        expiredCount: 0,
      });
    }

    const results = [];

    for (const owner of expiredOwners) {
      // Mark subscription as expired
      owner.subscriptionStatus = 'expired';
      await owner.save();

      // Deactivate all turfs owned by this user
      const updateResult = await Turf.updateMany(
        { ownerUid: owner.uid, isActive: true },
        { $set: { isActive: false } }
      );

      results.push({
        ownerUid: owner.uid,
        ownerName: owner.name,
        ownerEmail: owner.email,
        plan: owner.subscriptionPlan,
        expiredAt: owner.subscriptionEndDate,
        turfsDeactivated: updateResult.modifiedCount,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${expiredOwners.length} expired subscription(s) processed`,
      expiredCount: expiredOwners.length,
      results,
    });
  } catch (error: any) {
    console.error('Error checking subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}
