import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Turf from '@/app/models/Turf';
import Booking from '@/app/models/Booking';

export async function GET() {
  try {
    await connectMongoDB();

    // 1. Total Turfs
    const totalTurfs = await Turf.countDocuments({ isActive: true });

    // 2. Bookings this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const bookingsThisMonth = await Booking.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // 3. Average Rating
    const turfsWithRatings = await Turf.find({ rating: { $exists: true, $gt: 0 } }).select('rating');
    let avgRating = 0;
    if (turfsWithRatings.length > 0) {
      const sumRatings = turfsWithRatings.reduce((sum, t) => sum + (t.rating || 0), 0);
      avgRating = sumRatings / turfsWithRatings.length;
    }

    // 4. Distinct Cities
    const distinctCities = await Turf.distinct('location.city', { isActive: true, 'location.city': { $ne: null } });
    
    return NextResponse.json({
      success: true,
      stats: {
        turfsListed: totalTurfs,
        bookingsThisMonth,
        avgRating: avgRating > 0 ? avgRating.toFixed(1) : 'N/A',
        cities: distinctCities.length,
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}