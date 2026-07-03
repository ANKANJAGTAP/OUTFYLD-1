import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, props: { params: Promise<{ customerId: string }> }) {
  const params = await props.params;
  try {
    const customerId = params.customerId;
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    await connectMongoDB();

    // Check by Firebase UID first, fallback to MongoDB _id
    let customer;
    try {
      customer = await User.findOne({ uid: customerId });
    } catch {
      customer = await User.findById(customerId);
    }

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Determine tier based on points
    const points = customer.loyaltyPoints || 0;
    let tier = 'Bronze';
    let nextTier = 'Silver';
    let pointsToNextTier = 1000 - points;

    if (points >= 5000) {
      tier = 'Platinum';
      nextTier = 'Max Tier';
      pointsToNextTier = 0;
    } else if (points >= 2500) {
      tier = 'Gold';
      nextTier = 'Platinum';
      pointsToNextTier = 5000 - points;
    } else if (points >= 1000) {
      tier = 'Silver';
      nextTier = 'Gold';
      pointsToNextTier = 2500 - points;
    }

    // Calculate progress to next tier
    const currentTierBasePoints = tier === 'Bronze' ? 0 : tier === 'Silver' ? 1000 : tier === 'Gold' ? 2500 : 5000;
    const nextTierPoints = tier === 'Bronze' ? 1000 : tier === 'Silver' ? 2500 : tier === 'Gold' ? 5000 : 5000;
    
    let progressValue = 100;
    if (nextTierPoints > currentTierBasePoints) {
      progressValue = ((points - currentTierBasePoints) / (nextTierPoints - currentTierBasePoints)) * 100;
    }

    return NextResponse.json({
      success: true,
      data: {
        currentPoints: customer.loyaltyPoints || 0,
        tier,
        nextTier,
        pointsToNextTier: Math.max(0, pointsToNextTier),
        progressValue: Math.min(100, Math.max(0, progressValue)),
        recentTransactions: (customer.loyaltyHistory || [])
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 50) // Return last 50 transactions
      }
    });

  } catch (error: any) {
    console.error('Error fetching customer loyalty data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
