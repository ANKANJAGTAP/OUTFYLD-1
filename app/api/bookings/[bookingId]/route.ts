import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Booking from '@/app/models/Booking';
import Turf from '@/app/models/Turf'; // Needed for population
import User from '@/app/models/User'; // Needed for population

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    await connectMongoDB();

    const booking = await Booking.findById(params.bookingId)
      .populate('turfId', 'name businessName location')
      .populate('customerId', 'name email phone')
      .populate('ownerId', 'name email phone businessName');

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Find sibling bookings for multi-slot checkout via same Razorpay order
    let allBookingsForOrder = [booking];
    try {
      if (booking.razorpayOrderId) {
        allBookingsForOrder = await Booking.find({
          razorpayOrderId: booking.razorpayOrderId
        })
        .populate('turfId', 'name businessName location')
        .populate('customerId', 'name email phone')
        .populate('ownerId', 'name email phone businessName');
      }
    } catch(e) {}
    
    // Consolidate values
    let totalBaseAmount = 0;
    let totalPromoDiscount = 0;
    let totalDynamicDiscount = 0;
    let totalLoyaltyDiscount = 0;
    
    for (const b of allBookingsForOrder) {
      totalBaseAmount += (b.totalAmount || 0);
      totalPromoDiscount += (b.promoDiscountAmount || 0);
      totalDynamicDiscount += (b.dynamicDiscountAmount || 0);
      totalLoyaltyDiscount += (b.loyaltyDiscountAmount || 0);
    }
    
    // Create a virtual aggregated booking object based on the first booking
    // This allows the frontend to seamlessly render the total order values while retaining turf data
    const aggregatedBooking = {
      ...booking.toObject(),
      slotCount: allBookingsForOrder.length,
      allSlots: allBookingsForOrder.map(b => b.slot),
      totalAmount: totalBaseAmount,
      promoDiscountAmount: totalPromoDiscount,
      dynamicDiscountAmount: totalDynamicDiscount,
      loyaltyDiscountAmount: totalLoyaltyDiscount,
    };

    return NextResponse.json({ success: true, booking: aggregatedBooking });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
