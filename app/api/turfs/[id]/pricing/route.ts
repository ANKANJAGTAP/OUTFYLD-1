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

    const turf = await Turf.findById(id).select('pricing maxDiscount availableSlots');

    if (!turf) {
      return NextResponse.json({ error: 'Turf not found' }, { status: 404 });
    }

    const periodDiscounts = await calculatePeriodDiscountsForDate(turf, dateStr);

    return NextResponse.json({ periodDiscounts });
  } catch (error) {
    console.error('Error calculating pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
