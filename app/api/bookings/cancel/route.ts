import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Booking from '@/app/models/Booking';
import User from '@/app/models/User';
import Settings from '@/app/models/Settings';
import { initiateRefund } from '@/lib/razorpay';
import { sendBookingConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/cancel
 * Cancel a confirmed booking and issue refund based on cancellation policy
 *
 * Cancellation Policy:
 * - Owner cancels → 100% refund to player (full totalAmount)
 * - Player cancels:
 *   - > 24h before slot → 100% refund (of owner's 90% share)
 *   - 4-24h before slot → 50% refund (of owner's 90% share)
 *   - < 4h before slot → No refund
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, cancelledBy, reason, userUid } = body;

    if (!bookingId || !cancelledBy || !userUid) {
      return NextResponse.json(
        { error: 'bookingId, cancelledBy, and userUid are required' },
        { status: 400 }
      );
    }

    if (!['player', 'owner'].includes(cancelledBy)) {
      return NextResponse.json(
        { error: 'cancelledBy must be "player" or "owner"' },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only confirmed bookings can be cancelled
    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: `Cannot cancel a booking with status "${booking.status}"` },
        { status: 400 }
      );
    }

    // Verify the user has permission to cancel
    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (cancelledBy === 'player') {
      if (booking.customerId.toString() !== user._id.toString()) {
        return NextResponse.json({ error: 'You can only cancel your own bookings' }, { status: 403 });
      }
    } else if (cancelledBy === 'owner') {
      if (booking.ownerId.toString() !== user._id.toString()) {
        return NextResponse.json(
          { error: 'You can only cancel bookings for your own turfs' },
          { status: 403 }
        );
      }
    }

    // Get cancellation policy from settings
    let fullRefundHours = 24;
    let partialRefundHours = 4;
    let partialRefundPercent = 50;

    try {
      const settings = await Settings.findOne({});
      if (settings?.cancellationPolicy) {
        fullRefundHours = settings.cancellationPolicy.fullRefundHours || 24;
        partialRefundHours = settings.cancellationPolicy.partialRefundHours || 4;
        partialRefundPercent = settings.cancellationPolicy.partialRefundPercent || 50;
      }
    } catch {
      // use defaults
    }

    // Calculate time until slot
    const slotDateTime = new Date(`${booking.slot.date}T${booking.slot.startTime}:00`);
    const now = new Date();
    const hoursUntilSlot = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Calculate refund amount
    let refundAmount = 0;
    let refundType = 'none';

    if (cancelledBy === 'owner') {
      // Owner cancels → full refund to player (100% of the totalAmount)
      refundAmount = booking.totalAmount;
      refundType = 'full';
    } else {
      // Player cancels → refund based on time policy (refund from owner's share only)
      if (hoursUntilSlot > fullRefundHours) {
        // > 24 hours → 100% refund of owner's share
        refundAmount = booking.ownerShare || Math.round(booking.totalAmount * 0.9 * 100) / 100;
        refundType = 'full';
      } else if (hoursUntilSlot > partialRefundHours) {
        // 4-24 hours → 50% refund of owner's share
        const ownerShare = booking.ownerShare || Math.round(booking.totalAmount * 0.9 * 100) / 100;
        refundAmount = Math.round(ownerShare * (partialRefundPercent / 100) * 100) / 100;
        refundType = 'partial';
      }
      // < 4 hours → no refund (refundAmount stays 0)
    }

    // Issue refund via Razorpay
    let refundId = null;
    let refundStatus: 'pending' | 'processed' | 'failed' = 'processed';

    if (refundAmount > 0 && booking.razorpayPaymentId) {
      try {
        const refundResult = await initiateRefund(
          booking.razorpayPaymentId,
          refundAmount,
          {
            bookingId: booking._id.toString(),
            cancelledBy,
            reason: reason || 'Booking cancelled',
          }
        );
        refundId = refundResult.id;
        refundStatus = 'processed';
      } catch (refundError: any) {
        console.error('Refund failed:', refundError);
        refundStatus = 'failed';
        // Don't block cancellation — admin can retry refund manually
      }
    }

    // Update booking
    const newStatus = refundAmount > 0
      ? (refundType === 'full' ? 'refunded' : 'partially_refunded')
      : 'cancelled';

    booking.status = newStatus;
    booking.cancelledBy = cancelledBy;
    booking.cancelledAt = now;
    booking.cancellationReason = reason || undefined;
    booking.refundAmount = refundAmount;
    booking.refundId = refundId || undefined;
    booking.refundStatus = refundAmount > 0 ? refundStatus : undefined;
    booking.refundProcessedAt = refundAmount > 0 ? now : undefined;

    if (refundType === 'full') {
      booking.paymentStatus = 'refunded';
    } else if (refundType === 'partial') {
      booking.paymentStatus = 'partially_refunded';
    }

    await booking.save();

    // Send notification emails
    setImmediate(async () => {
      try {
        const populatedBooking = await Booking.findById(booking._id)
          .populate('customerId', 'name email phone')
          .populate('ownerId', 'name email phone')
          .populate('turfId', 'name location');

        const customerData = populatedBooking.customerId as any;
        const ownerData = populatedBooking.ownerId as any;
        const turfData = populatedBooking.turfId as any;

        const bookingDetails = {
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          turfName: turfData.name,
          turfLocation: `${turfData.location?.city || ''}`,
          bookingDate: booking.slot.date,
          bookingTime: `${booking.slot.startTime} - ${booking.slot.endTime}`,
          totalAmount: booking.totalAmount,
          bookingId: booking._id.toString(),
        };

        // Notify customer
        if (customerData.email) {
          try {
            await sendBookingConfirmationEmail(
              customerData.email,
              customerData.name,
              bookingDetails,
              'rejected' // reuse the rejected template for cancellation notification
            );
          } catch (e) { console.error('Cancellation email to customer failed:', e); }
        }

        // Notify owner
        if (ownerData.email) {
          try {
            await sendBookingConfirmationEmail(
              ownerData.email,
              ownerData.name,
              bookingDetails,
              'rejected'
            );
          } catch (e) { console.error('Cancellation email to owner failed:', e); }
        }
      } catch (notifError) {
        console.error('Error sending cancellation notifications:', notifError);
      }
    });

    return NextResponse.json({
      success: true,
      message: refundAmount > 0
        ? `Booking cancelled. Refund of ₹${refundAmount} ${refundStatus === 'processed' ? 'has been initiated' : 'will be processed manually'}.`
        : 'Booking cancelled. No refund applicable as per cancellation policy.',
      booking: {
        _id: booking._id,
        status: booking.status,
        cancelledBy: booking.cancelledBy,
        refundAmount: booking.refundAmount,
        refundStatus: booking.refundStatus,
        refundType,
        hoursUntilSlot: Math.round(hoursUntilSlot * 10) / 10,
      },
    });
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
