import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Booking from '@/app/models/Booking';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { turfId: string } }
) {
  try {
    await connectMongoDB();

    const { turfId } = params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    console.log('Fetching confirmed bookings for turf:', { turfId, startDate, endDate });

    // Build query for confirmed bookings
    let query: any = {
      turfId: turfId,
      status: 'confirmed'
    };

    // If date range is provided, filter by the specific dates stored in booking.slot.date
    if (startDate && endDate) {
      query['slot.date'] = {
        $gte: startDate, // Greater than or equal to start date
        $lte: endDate    // Less than or equal to end date
      };
    }

    // Get all confirmed bookings for this turf (filtered by date range if provided)
    const confirmedBookings = await Booking.find(query).select('slot createdAt');

    console.log(`Found ${confirmedBookings.length} confirmed bookings`);

    // Map bookings to booked slots format
    const bookedSlots = confirmedBookings.map(booking => ({
      date: booking.slot.date,  // Specific date from the booking (YYYY-MM-DD)
      day: booking.slot.day,
      startTime: booking.slot.startTime,
      endTime: booking.slot.endTime
    }));

    console.log(`Returning ${bookedSlots.length} booked slots for date range ${startDate} to ${endDate}`);

    return NextResponse.json({
      success: true,
      bookedSlots
    });

  } catch (error) {
    console.error('Error fetching confirmed bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
