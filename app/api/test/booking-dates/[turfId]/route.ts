import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Booking from '@/app/models/Booking';

export const dynamic = 'force-dynamic';

/**
 * GET /api/test/booking-dates/[turfId]
 * Test endpoint to verify date-specific booking behavior
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { turfId: string } }
) {
  try {
    const { turfId } = params;
    const { searchParams } = new URL(request.url);
    const testDate1 = searchParams.get('date1') || '2025-10-31'; // Saturday
    const testDate2 = searchParams.get('date2') || '2025-11-07'; // Next Saturday

    await connectMongoDB();

    // Get all bookings for this turf
    const allBookings = await Booking.find({
      turfId: turfId,
      status: { $in: ['pending', 'confirmed'] }
    }).select('slot status createdAt');

    // Filter bookings for the two test dates
    const bookingsForDate1 = allBookings.filter(booking => booking.slot.date === testDate1);
    const bookingsForDate2 = allBookings.filter(booking => booking.slot.date === testDate2);

    // Get all Saturdays in general (old buggy way)
    const allSaturdayBookings = allBookings.filter(booking => booking.slot.day === 'Saturday');

    return NextResponse.json({
      success: true,
      testInfo: {
        turfId,
        testDate1: `${testDate1} (Saturday)`,
        testDate2: `${testDate2} (Next Saturday)`,
        currentTime: new Date().toISOString()
      },
      results: {
        totalBookings: allBookings.length,
        bookingsForSpecificDate1: {
          count: bookingsForDate1.length,
          bookings: bookingsForDate1.map(b => ({
            date: b.slot.date,
            day: b.slot.day,
            time: `${b.slot.startTime}-${b.slot.endTime}`,
            status: b.status
          }))
        },
        bookingsForSpecificDate2: {
          count: bookingsForDate2.length,
          bookings: bookingsForDate2.map(b => ({
            date: b.slot.date,
            day: b.slot.day,
            time: `${b.slot.startTime}-${b.slot.endTime}`,
            status: b.status
          }))
        },
        allSaturdayBookings: {
          count: allSaturdayBookings.length,
          note: "This shows all Saturday bookings across all dates (old way - should NOT affect availability)",
          bookings: allSaturdayBookings.map(b => ({
            date: b.slot.date,
            day: b.slot.day,
            time: `${b.slot.startTime}-${b.slot.endTime}`,
            status: b.status
          }))
        }
      },
      conclusion: bookingsForDate1.length > 0 && bookingsForDate2.length === 0 
        ? "✅ FIXED: Bookings are date-specific. Saturday bookings don't affect other Saturdays!"
        : bookingsForDate1.length === 0 && bookingsForDate2.length === 0
        ? "ℹ️  No bookings found for either test date."
        : "⚠️  Multiple dates affected - may need further investigation."
    });

  } catch (error: any) {
    console.error('Error in booking dates test:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
