import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Booking from '@/app/models/Booking';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { sendBookingStatusSMS } from '@/lib/sms';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    await connectMongoDB();

    const { bookingId } = params;
    const { status } = await request.json();

    console.log('Updating booking status:', { bookingId, status });

    // Validate status
    if (!status || !['confirmed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "confirmed" or "rejected"' },
        { status: 400 }
      );
    }

    // Find and update the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking is still pending
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: 'Booking has already been processed' },
        { status: 400 }
      );
    }

    // Update the booking status
    booking.status = status;
    booking.updatedAt = new Date();
    await booking.save();

    console.log('Booking status updated successfully');

    // Return the updated booking with populated data
    const updatedBooking = await Booking.findById(bookingId)
      .populate('customerId', 'name email phone uid')
      .populate('ownerId', 'name email businessName')
      .populate('turfId', 'name contactInfo description location pricing');

    // Send notification to customer (async, don't block response)
    setImmediate(async () => {
      try {
        const customerData = updatedBooking.customerId as any;
        const turfData = updatedBooking.turfId as any;
        const slotData = updatedBooking.slot;

        const bookingDetails = {
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          turfName: turfData.name || turfData.contactInfo?.businessName,
          turfLocation: `${turfData.location?.city || ''}, ${turfData.location?.state || ''}`.trim(),
          bookingDate: slotData.day,
          bookingTime: `${slotData.startTime} - ${slotData.endTime}`,
          totalAmount: updatedBooking.totalAmount,
          bookingId: updatedBooking._id.toString(),
        };

        // Send email notification to customer
        if (customerData.email) {
          try {
            await sendBookingConfirmationEmail(
              customerData.email,
              customerData.name,
              bookingDetails,
              status as 'confirmed' | 'rejected'
            );
            console.log(`✅ ${status} email sent to customer`);
          } catch (emailError) {
            console.error('❌ Failed to send email to customer:', emailError);
          }
        }

        // Send SMS notification to customer
        console.log('📱 BOOKING STATUS API: Checking customer phone for SMS...');
        console.log('📱 BOOKING STATUS API: Customer phone:', customerData.phone);
        
        if (customerData.phone) {
          try {
            console.log(`📱 BOOKING STATUS API: Calling sendBookingStatusSMS with status: ${status}`);
            await sendBookingStatusSMS(
              customerData.phone,
              customerData.name,
              turfData.name || turfData.contactInfo?.businessName,
              status as 'confirmed' | 'rejected'
            );
            console.log(`✅ BOOKING STATUS API: ${status} SMS sent to customer`);
          } catch (smsError) {
            console.error('❌ BOOKING STATUS API: Failed to send SMS to customer:', smsError);
          }
        } else {
          console.warn('⚠️ BOOKING STATUS API: Customer phone not available, skipping SMS');
        }
      } catch (notificationError) {
        console.error('Error sending customer notifications:', notificationError);
      }
    });

    return NextResponse.json({
      message: `Booking ${status} successfully`,
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}