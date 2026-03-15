import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Booking from '@/app/models/Booking';
import SlotReservation from '@/app/models/SlotReservation';

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    
    const { slots, turfId, customerId } = await request.json();
    
    if (!slots || !Array.isArray(slots) || !turfId) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Clean up stale pending_payment bookings (older than 10 minutes)
    const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);
    await Booking.deleteMany({
      status: 'pending_payment',
      createdAt: { $lt: staleThreshold },
    });

    // Check if any of the slots are now booked or reserved by others
    const conflictResults = await Promise.all(
      slots.map(async (slot: any) => {
        // Check for confirmed bookings (always block)
        const confirmedBooking = await Booking.findOne({
          turfId,
          'slot.day': slot.day,
          'slot.startTime': slot.startTime,
          'slot.endTime': slot.endTime,
          'slot.date': slot.date,
          status: 'confirmed'
        });

        if (confirmedBooking) {
          return { slot, conflict: 'booked' };
        }

        // Check for pending_payment bookings by OTHER customers
        if (customerId) {
          // Look up this user's MongoDB _id from the UID
          const User = (await import('@/app/models/User')).default;
          const currentUser = await User.findOne({ uid: customerId });
          if (currentUser) {
            const pendingBooking = await Booking.findOne({
              turfId,
              'slot.day': slot.day,
              'slot.startTime': slot.startTime,
              'slot.endTime': slot.endTime,
              'slot.date': slot.date,
              status: 'pending_payment',
              customerId: { $ne: currentUser._id },
            });

            if (pendingBooking) {
              return { slot, conflict: 'booked' };
            }
          }
        }

        // Check for reservations by other customers
        if (customerId) {
          const reservation = await SlotReservation.findOne({
            turfId,
            'slot.day': slot.day,
            'slot.startTime': slot.startTime,
            'slot.endTime': slot.endTime,
            'slot.date': slot.date,
            customerId: { $ne: customerId }
          });

          if (reservation) {
            const timeLeft = Math.ceil((reservation.expiresAt.getTime() - Date.now()) / 60000);
            return { 
              slot, 
              conflict: 'reserved', 
              timeLeft: Math.max(timeLeft, 1),
              reservedBy: 'another customer'
            };
          }
        }

        return { slot, conflict: null };
      })
    );

    const conflicts = conflictResults.filter(result => result.conflict);

    if (conflicts.length > 0) {
      const bookedSlots = conflicts.filter(c => c.conflict === 'booked');
      const reservedSlots = conflicts.filter(c => c.conflict === 'reserved');
      
      let errorMessage = 'Some slots are no longer available:\n';
      
      if (bookedSlots.length > 0) {
        errorMessage += `\n• Booked slots: ${bookedSlots.map(c => `${c.slot.startTime}-${c.slot.endTime}`).join(', ')}`;
      }
      
      if (reservedSlots.length > 0) {
        const maxTimeLeft = Math.max(...reservedSlots.map(c => c.timeLeft || 1));
        errorMessage += `\n• Reserved slots: ${reservedSlots.map(c => `${c.slot.startTime}-${c.slot.endTime}`).join(', ')} (available in ${maxTimeLeft} min)`;
      }

      return NextResponse.json(
        { 
          available: false,
          error: errorMessage,
          bookedSlots: bookedSlots.map(c => c.slot),
          reservedSlots: reservedSlots.map(c => ({ ...c.slot, timeLeft: c.timeLeft })),
          code: 'SLOT_CONFLICT'
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      available: true,
      message: 'All slots are still available'
    });

  } catch (error) {
    console.error('Error verifying slots:', error);
    return NextResponse.json(
      { error: 'Failed to verify slot availability' },
      { status: 500 }
    );
  }
}