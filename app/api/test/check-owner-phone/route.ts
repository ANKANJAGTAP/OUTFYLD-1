import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    // Get owner email from query params
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Find owner by email
    const owner = await User.findOne({ email, role: 'owner' });

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      owner: {
        name: owner.name,
        email: owner.email,
        phone: owner.phone || 'No phone number set',
        hasPhone: !!owner.phone,
      }
    });

  } catch (error: any) {
    console.error('Error checking owner phone:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}
