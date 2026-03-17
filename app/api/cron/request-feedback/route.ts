import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Booking from '@/app/models/Booking';
import User from '@/app/models/User';
import Turf from '@/app/models/Turf';
import { sendFeedbackRequestEmail } from '@/lib/email';
import { isBefore, parse } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Optional: add basic authorization header check here if needed for security
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectMongoDB();

    // 1. We want bookings that are "confirmed" and not yet emailed
    const pendingFeedbackBookings = await Booking.find({
      status: 'confirmed',
      feedbackEmailSent: { $ne: true },
    }).populate('customerId', 'name email').populate('turfId', 'businessName');

    const now = new Date();
    let emailsSent = 0;

    for (const booking of pendingFeedbackBookings) {
      if (!booking.slot || !booking.slot.date || !booking.slot.endTime) {
        continue;
      }

      // Slot date format is 'yyyy-MM-dd', endTime format is 'HH:mm'
      // Example: '2026-03-18' and '19:00'
      const endTimeString = `${booking.slot.date} ${booking.slot.endTime}`;
      
      try {
        const slotEndDateTime = parse(endTimeString, 'yyyy-MM-dd HH:mm', new Date());
        
        // If current time is strictly after the slot end time
        if (isBefore(slotEndDateTime, now)) {
          const customerEmail = booking.customerId?.email;
          const customerName = booking.customerId?.name || 'Player';
          const turfName = booking.turfId?.businessName || 'the turf';
          
          if (customerEmail) {
            await sendFeedbackRequestEmail(
              customerEmail,
              customerName,
              turfName,
              booking._id.toString()
            );
            
            emailsSent++;
          }
          
          // Mark as sent whether email succeeded or if the customer didn't have an email
          // This prevents infinite retries
          booking.feedbackEmailSent = true;
          await booking.save();
        }
      } catch (dateParseError) {
        console.error(`Error parsing date for booking ${booking._id}:`, dateParseError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed feedback emails. Sent ${emailsSent} emails.`,
      count: emailsSent
    });
  } catch (error: any) {
    console.error('Error in request-feedback cron:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
