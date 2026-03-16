import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Turf from '@/app/models/Turf';
import { calculatePeriodDiscountsForDate } from '@/lib/pricingEngine';

export const dynamic = 'force-dynamic';

/**
 * GET /api/turfs/[id]/pricing?date=2026-03-17
 * Returns per-period discount data for a specific date.
 * Used by the booking page to show per-slot prices when user selects a date.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB();

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { error: 'date query parameter is required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // .lean() returns plain JS object — 3-5x faster than Mongoose document
    const turf = await Turf.findById(id)
      .select('pricing maxDiscount availableSlots')
      .lean();

    if (!turf) {
      return NextResponse.json({ error: 'Turf not found' }, { status: 404 });
    }

    // calculatePeriodDiscountsForDate already handles maxDiscount=0 with early return
    const periodDiscounts = await calculatePeriodDiscountsForDate(turf as any, dateStr);

    return NextResponse.json({ periodDiscounts });
  } catch (error) {
    console.error('Error calculating pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}