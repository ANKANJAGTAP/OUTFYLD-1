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

    // Get all confirmed bookings for this turf
    const confirmedBookings = await Booking.find({
      turfId: turfId,
      status: 'confirmed'
    }).select('slot createdAt');

    console.log(`Found ${confirmedBookings.length} confirmed bookings`);

    // If date range is provided, filter by date range
    // Since bookings only store day name, we need to calculate which bookings fall in the range
    let bookedSlots: Array<{
      date: string; // YYYY-MM-DD
      day: string;
      startTime: string;
      endTime: string;
    }> = [];

    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);

      // For each booking, determine which dates in the range match the day
      confirmedBookings.forEach(booking => {
        const dayName = booking.slot.day;
        
        // Iterate through each day in the range
        let currentDate = new Date(start);
        while (currentDate <= end) {
          const currentDayName = format(currentDate, 'EEEE'); // Monday, Tuesday, etc.
          
          // If this date matches the booking's day, add it
          if (currentDayName === dayName) {
            // Check if booking was created before this date (to avoid showing future recurring bookings)
            const bookingDate = startOfDay(new Date(booking.createdAt));
            const checkDate = startOfDay(currentDate);
            
            if (checkDate >= bookingDate) {
              bookedSlots.push({
                date: format(currentDate, 'yyyy-MM-dd'),
                day: booking.slot.day,
                startTime: booking.slot.startTime,
                endTime: booking.slot.endTime
              });
            }
          }
          
          // Move to next day
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    } else {
      // If no date range, return all confirmed bookings (without specific dates)
      bookedSlots = confirmedBookings.map(booking => ({
        date: '', // No specific date
        day: booking.slot.day,
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime
      }));
    }

    console.log(`Returning ${bookedSlots.length} booked slots`);

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
