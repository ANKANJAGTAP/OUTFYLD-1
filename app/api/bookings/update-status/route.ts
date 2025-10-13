import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Booking from '@/app/models/Booking';
import User from '@/app/models/User';
import mongoose from 'mongoose';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { bookingId, status, ownerId } = body;

    // Validate required fields
    if (!bookingId || !status || !ownerId) {
      return NextResponse.json(
        { error: 'Booking ID, status, and owner ID are required' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['confirmed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "confirmed" or "rejected"' },
        { status: 400 }
      );
    }

    // Validate that the owner exists
    const owner = await User.findById(ownerId);
    if (!owner || owner.role !== 'owner') {
      return NextResponse.json(
        { error: 'Invalid owner ID' },
        { status: 400 }
      );
    }

    // Find the booking and verify ownership
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify that this owner owns the turf for this booking
    if (booking.ownerId.toString() !== ownerId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only manage bookings for your own turfs' },
        { status: 403 }
      );
    }

    // Check if booking is already processed
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: 'This booking has already been processed' },
        { status: 400 }
      );
    }

    // Start a transaction to ensure data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update booking status
      booking.status = status;
      await booking.save({ session });

      // If approved, mark the slot as booked in the turf owner's profile
      if (status === 'confirmed') {
        const turf = await User.findById(booking.turfId).session(session);
        if (turf && turf.availableSlots) {
          // Find the matching slot and mark it as booked
          const slotIndex = turf.availableSlots.findIndex((slot: any) => 
            slot.day === booking.slot.day &&
            slot.startTime === booking.slot.startTime &&
            slot.endTime === booking.slot.endTime
          );

          if (slotIndex !== -1) {
            // Add a 'booked' property to track booked slots
            // Note: This requires updating the User schema to support booked slots
            // For now, we'll handle this differently by checking bookings when displaying slots
          }
        }
      }

      await session.commitTransaction();

      // Populate the updated booking for response
      const updatedBooking = await Booking.findById(booking._id)
        .populate('customerId', 'name email phone')
        .populate('turfId', 'businessName location pricing');

      return NextResponse.json({
        message: `Booking ${status} successfully`,
        booking: updatedBooking
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}