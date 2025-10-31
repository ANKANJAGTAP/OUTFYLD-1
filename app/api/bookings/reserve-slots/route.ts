import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import SlotReservation from '@/app/models/SlotReservation';
import Booking from '@/app/models/Booking';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    
    const { action, customerId, turfId, slots } = await request.json();
    
    if (!action || !customerId || !turfId || !Array.isArray(slots)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const session = await mongoose.startSession();

    try {
      if (action === 'reserve') {
        // Reserve slots for 10 minutes (payment window)
        const reservationExpiry = new Date(Date.now() + 10 * 60 * 1000);
        
        await session.withTransaction(async () => {
          // Check if slots are already booked or reserved
          for (const slot of slots) {
            // Check for existing bookings
            const existingBooking = await Booking.findOne({
              turfId,
              'slot.day': slot.day,
              'slot.startTime': slot.startTime,
              'slot.endTime': slot.endTime,
              'slot.date': slot.date,
              status: { $in: ['pending', 'confirmed'] }
            }).session(session);

            if (existingBooking) {
              throw new Error(`SLOT_BOOKED:${JSON.stringify(slot)}`);
            }

            // Check for existing reservations by other users
            const existingReservation = await SlotReservation.findOne({
              turfId,
              'slot.day': slot.day,
              'slot.startTime': slot.startTime,
              'slot.endTime': slot.endTime,
              'slot.date': slot.date,
              customerId: { $ne: customerId } // Different customer
            }).session(session);

            if (existingReservation) {
              const timeLeft = Math.ceil((existingReservation.expiresAt.getTime() - Date.now()) / 60000);
              throw new Error(`SLOT_RESERVED:${JSON.stringify({
                slot,
                timeLeft: Math.max(timeLeft, 1)
              })}`);
            }
          }

          // Remove any existing reservations by this customer for these slots
          await SlotReservation.deleteMany({
            customerId,
            turfId
          }).session(session);

          // Create new reservations
          const reservations = slots.map(slot => ({
            customerId,
            turfId,
            slot,
            expiresAt: reservationExpiry
          }));

          await SlotReservation.insertMany(reservations, { session });
        });

        await session.endSession();

        return NextResponse.json({
          success: true,
          message: 'Slots reserved successfully',
          expiresAt: reservationExpiry,
          reservationMinutes: 10
        });

      } else if (action === 'release') {
        // Release reservations for this customer
        await SlotReservation.deleteMany({
          customerId,
          turfId
        });

        await session.endSession();

        return NextResponse.json({
          success: true,
          message: 'Reservations released'
        });

      } else {
        await session.endSession();
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
      }

    } catch (transactionError) {
      await session.endSession();
      
      // Handle specific errors
      if (transactionError instanceof Error) {
        if (transactionError.message.startsWith('SLOT_BOOKED:')) {
          const slot = JSON.parse(transactionError.message.replace('SLOT_BOOKED:', ''));
          return NextResponse.json(
            { 
              error: 'Slot is already booked',
              slot,
              code: 'SLOT_BOOKED'
            },
            { status: 409 }
          );
        }
        
        if (transactionError.message.startsWith('SLOT_RESERVED:')) {
          const data = JSON.parse(transactionError.message.replace('SLOT_RESERVED:', ''));
          return NextResponse.json(
            { 
              error: `Slot is temporarily reserved by another customer. Please wait ${data.timeLeft} minute(s) or select a different slot.`,
              slot: data.slot,
              timeLeft: data.timeLeft,
              code: 'SLOT_RESERVED'
            },
            { status: 409 }
          );
        }
      }
      
      throw transactionError;
    }

  } catch (error) {
    console.error('Error managing slot reservations:', error);
    return NextResponse.json(
      { error: 'Failed to manage slot reservations' },
      { status: 500 }
    );
  }
}