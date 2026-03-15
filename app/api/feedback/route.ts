import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Turf from '@/app/models/Turf';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_URI);
}

// Review schema
const reviewSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, required: true },
  turfId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Turf' },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { bookingId, rating, review } = await req.json();

    if (!bookingId || !rating) {
      return NextResponse.json(
        { error: 'Booking ID and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get booking details
    const Booking = mongoose.models.Booking || mongoose.model('Booking', new mongoose.Schema({}, { strict: false }));
    const booking = await Booking.findById(bookingId).populate('turf');

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if feedback already exists
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return NextResponse.json(
        { error: 'Feedback already submitted for this booking' },
        { status: 400 }
      );
    }

    // Create new review
    const newReview = await Review.create({
      bookingId,
      turfId: booking.turf._id,
      customerId: booking.customer,
      customerName: booking.customerName,
      rating,
      review: review || '',
    });

    // Update turf rating
    const turfReviews = await Review.find({ turfId: booking.turf._id });
    const totalRating = turfReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / turfReviews.length;

    await Turf.findByIdAndUpdate(booking.turf._id, {
      rating: averageRating,
      reviewCount: turfReviews.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      review: newReview,
    });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch reviews for a turf
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const turfId = searchParams.get('turfId');

    if (!turfId) {
      return NextResponse.json(
        { error: 'Turf ID is required' },
        { status: 400 }
      );
    }

    const reviews = await Review.find({ turfId })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      reviews,
      count: reviews.length,
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
