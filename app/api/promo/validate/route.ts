import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import User from '@/app/models/User';
import Booking from '@/app/models/Booking';

export const dynamic = 'force-dynamic';

/**
 * POST /api/promo/validate
 * Validates a promo code for a customer.
 * Currently supports: WELCOME100 (₹100 off for first-time users)
 */
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { customerId, promoCode } = body;

    if (!customerId || !promoCode) {
      return NextResponse.json(
        { valid: false, message: 'Customer ID and promo code are required' },
        { status: 400 }
      );
    }

    const code = promoCode.toUpperCase().trim();

    if (code === 'WELCOME100') {
      // Find customer by Firebase UID
      const customer = await User.findOne({ uid: customerId, role: 'customer' });

      if (!customer) {
        return NextResponse.json(
          { valid: false, message: 'Customer not found' },
          { status: 404 }
        );
      }

      // Check if user has any confirmed bookings
      const previousBookings = await Booking.countDocuments({
        customerId: customer._id,
        status: 'confirmed',
      });

      if (previousBookings > 0) {
        return NextResponse.json({
          valid: false,
          message: 'WELCOME100 is only for first-time users. You already have previous bookings.',
        });
      }

      return NextResponse.json({
        valid: true,
        discount: 100,
        message: '🎉 WELCOME100 applied! ₹100 off your first booking.',
      });
    }

    // Unknown promo code
    return NextResponse.json({
      valid: false,
      message: 'Invalid promo code',
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json(
      { valid: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
