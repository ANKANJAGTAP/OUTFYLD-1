import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Booking from '@/app/models/Booking';
import User from '@/app/models/User';
import Turf from '@/app/models/Turf';
import Settings from '@/app/models/Settings';
import SlotReservation from '@/app/models/SlotReservation';
import { verifyPaymentSignature, createTransfer } from '@/lib/razorpay';
import { sendBookingNotificationEmail, sendBookingConfirmationEmail } from '@/lib/email';
import { sendBookingNotificationSMS } from '@/lib/sms';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/verify-payment
 * Verify Razorpay payment, auto-confirm booking, and initiate payment split
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingIds,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingIds) {
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

    // Find all bookings for this order
    const bookings = await Booking.find({
      _id: { $in: bookingIds },
      razorpayOrderId: razorpay_order_id,
    });

    if (bookings.length === 0) {
      return NextResponse.json({ error: 'Bookings not found' }, { status: 404 });
    }

    // Check if already processed
    if (bookings[0].paymentStatus === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
      });
    }

    // Get platform commission percentage from settings
    let commissionPercent = 8; // default 8%
    try {
      const settings = await Settings.findOne({});
      if (settings?.platformCommissionPercent) {
        commissionPercent = settings.platformCommissionPercent;
      }
    } catch {
      // use default
    }

    // Calculate net amount for calculations
    const getNetAmount = (b: any) => (b.totalAmount || 0) - (b.promoDiscountAmount || 0) - (b.dynamicDiscountAmount || 0) - (b.loyaltyDiscountAmount || 0);
    const netTotalAmount = bookings.reduce((sum, b) => sum + getNetAmount(b), 0);
    
    // Calculate total amount and split based on net revenue
    const platformCommission = Math.round((netTotalAmount * commissionPercent / 100) * 100) / 100;
    const gatewayFee = Math.round((netTotalAmount * 2 / 100) * 100) / 100;
    const ownerShare = Math.round((netTotalAmount - platformCommission - gatewayFee) * 100) / 100;

    // Update all bookings to confirmed
    for (const booking of bookings) {
      booking.status = 'confirmed';
      booking.paymentStatus = 'paid';
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.razorpaySignature = razorpay_signature;
      
      const netAmount = getNetAmount(booking);
      booking.platformCommission = Math.round((netAmount * commissionPercent / 100) * 100) / 100;
      booking.gatewayFee = Math.round((netAmount * 2 / 100) * 100) / 100;
      booking.ownerShare = Math.round((netAmount - booking.platformCommission - booking.gatewayFee) * 100) / 100;
      await booking.save();
    }

    // Initiate transfer to turf owner's fund account
    const owner = await User.findById(bookings[0].ownerId);
    let transferId = null;

    if (owner?.razorpayLinkedAccountId) {
      try {
        const transferResult = await createTransfer(razorpay_payment_id, [
          {
            account: owner.razorpayLinkedAccountId,
            amount: ownerShare,
            currency: 'INR',
            notes: {
              purpose: 'booking_payment',
              bookingIds: bookingIds.join(','),
              ownerUid: owner.uid,
            },
          },
        ]);
        transferId = transferResult?.items?.[0]?.id || transferResult?.id;

        // Save transfer ID to bookings
        for (const booking of bookings) {
          booking.razorpayTransferId = transferId;
          await booking.save();
        }
      } catch (transferError: any) {
        console.error('Transfer to owner failed:', transferError);
        // Payment is still confirmed — transfer can be retried manually
        // Log for admin attention
      }
    } else {
      console.warn('Owner does not have a linked Razorpay account. Manual transfer required.');
    }

    // Fetch populated booking details outside of async block so it can be used for loyalty history
    let populatedBooking: any;
    try {
      populatedBooking = await Booking.findById(bookings[0]._id)
        .populate('customerId', 'name email phone')
        .populate('ownerId', 'name email businessName phone')
        .populate('turfId', 'name businessName contactInfo description location pricing');
    } catch (e) {
      console.error('Error prefetching populated booking:', e);
    }

    // Clean up slot reservations (uses Firebase UID since that's what reserve-slots stores)
    try {
      const customer = await User.findById(bookings[0].customerId);
      if (customer) {
        await SlotReservation.deleteMany({
          customerId: customer.uid, // Firebase UID, not MongoDB _id
          turfId: bookings[0].turfId,
        });
      }
    } catch (cleanupError) {
      console.error('Error cleaning up slot reservations:', cleanupError);
    }

    // Step 4.5: Update Customer Loyalty Points
    try {
      const customer = await User.findById(bookings[0].customerId);
      if (customer) {
        let totalDiscountReceived = 0;
        let totalPointsUsed = 0;
        let totalAmountPaid = 0;

        for (const booking of bookings) {
          totalDiscountReceived += (booking.loyaltyDiscountAmount || 0);
          totalPointsUsed += (booking.appliedLoyaltyPoints || 0);
          totalAmountPaid += booking.totalAmount - (booking.loyaltyDiscountAmount || 0);
        }

        // Deduct spent points
        if (totalPointsUsed > 0 && customer.loyaltyPoints >= totalPointsUsed) {
          customer.loyaltyPoints -= totalPointsUsed;
          customer.loyaltyHistory.push({
            amount: totalPointsUsed,
            type: 'spent',
            description: `Used for booking at ${populatedBooking?.turfId?.businessName || 'Turf'}`,
            date: new Date()
          });
        }

        // Add earned points (50% of the actual paid amount)
        const earnedPoints = Math.floor(totalAmountPaid * 0.5);
        if (earnedPoints > 0) {
          customer.loyaltyPoints += earnedPoints;
          customer.loyaltyHistory.push({
            amount: earnedPoints,
            type: 'earned',
            description: `Points earned from booking at ${populatedBooking?.turfId?.businessName || 'Turf'}`,
            date: new Date()
          });

          // Save the earned points to the bookings for records
          const pointsPerBooking = earnedPoints / bookings.length;
          for (const booking of bookings) {
            booking.loyaltyPointsEarned = pointsPerBooking;
            await booking.save();
          }
        }

        await customer.save();
      }
    } catch (loyaltyError) {
      console.error('Error updating loyalty points:', loyaltyError);
    }

    // Send notifications (async, non-blocking)
    setImmediate(async () => {
      try {
        const populatedBooking = await Booking.findById(bookings[0]._id)
          .populate('customerId', 'name email phone')
          .populate('ownerId', 'name email businessName phone')
          .populate('turfId', 'name contactInfo description location pricing');

        const ownerData = populatedBooking.ownerId as any;
        const turfData = populatedBooking.turfId as any;
        const customerData = populatedBooking.customerId as any;

        const slots = bookings.map((b) => b.slot);
        const timeSlotsText = slots.map((s: any) => `${s.startTime} - ${s.endTime}`).join(', ');

        const bookingDetails = {
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          turfName: turfData.name || turfData.contactInfo?.businessName,
          turfLocation: `${turfData.location?.city || ''}, ${turfData.location?.state || ''}`.trim(),
          bookingDate: `${slots[0].day}, ${slots[0].date}`,
          bookingTime: timeSlotsText,
          totalAmount: netTotalAmount,
          bookingId: bookings.map((b) => b._id.toString()).join(', '),
        };

        // Email to owner (Disabled per user request)
        
        if (ownerData.email) {
          try {
            await sendBookingNotificationEmail(ownerData.email, ownerData.name || 'Owner', bookingDetails);
          } catch (e) { console.error('Email to owner failed:', e); }
        }
        

        // Confirmation email to customer
        if (customerData.email) {
          try {
            await sendBookingConfirmationEmail(customerData.email, customerData.name, bookingDetails, 'confirmed');
          } catch (e) { console.error('Email to customer failed:', e); }
        }

        // SMS to owner
        if (ownerData.phone) {
          try {
            await sendBookingNotificationSMS(ownerData.phone, ownerData.name || 'Owner', bookingDetails);
          } catch (e) { console.error('SMS to owner failed:', e); }
        }
      } catch (notifError) {
        console.error('Error sending notifications:', notifError);
      }
    });

    return NextResponse.json({
      success: true,
      message: `${bookings.length} booking(s) confirmed and payment verified!`,
      bookings: bookings.map((b) => ({
        _id: b._id,
        slot: b.slot,
        totalAmount: b.totalAmount,
        status: b.status,
        paymentStatus: b.paymentStatus,
        ownerShare: b.ownerShare,
        platformCommission: b.platformCommission,
      })),
      transferInitiated: !!transferId,
    });
  } catch (error: any) {
    console.error('Error verifying booking payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
