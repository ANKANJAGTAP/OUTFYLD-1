import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    
    // For development, allow requests without auth, but in production you should verify
    // Connect to MongoDB
    await connectMongoDB();

    // Get all turf owners with their verification status
    const owners = await User.find(
      { role: 'owner' },
      {
        uid: 1,
        name: 1,
        email: 1,
        phone: 1,
        businessName: 1,
        subscriptionPlan: 1,
        subscriptionAmount: 1,
        paymentScreenshot: 1,
        verificationStatus: 1,
        paymentVerified: 1,
        paymentDetails: 1,
        rejectionReason: 1,
        isVerifiedByAdmin: 1,
        verifiedBy: 1,
        verifiedAt: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    ).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      owners,
    });

  } catch (error: any) {
    console.error('Error fetching owners:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
