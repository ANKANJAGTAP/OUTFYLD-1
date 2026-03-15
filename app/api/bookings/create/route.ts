import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Booking from '@/app/models/Booking';
import User from '@/app/models/User';
import Turf from '@/app/models/Turf';
import SlotReservation from '@/app/models/SlotReservation';
import { createOrder } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/create
 * Create a Razorpay order for booking payment and reserve slots
 * No longer accepts payment screenshots — payment is done via Razorpay checkout
 */
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { customerId, ownerId, turfId, slots, totalAmount, useLoyaltyPoints } = body;

    // Validate required fields
    if (!customerId || !ownerId || !turfId || !slots || !totalAmount) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Validate slots array
    if (!Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json({ error: 'Slots must be a non-empty array' }, { status: 400 });
    }

    for (const slot of slots) {
      if (!slot.day || !slot.date || !slot.startTime || !slot.endTime) {
        return NextResponse.json(
          { error: 'Each slot must contain day, date, startTime, and endTime' },
          { status: 400 }
        );
      }
    }

    // Verify customer, owner, and turf exist
    // customerId is always a Firebase UID (from user.uid on the frontend)
    // ownerId can be either a MongoDB ObjectId (from Turf.ownerId) or a Firebase UID
    const [customer, turf] = await Promise.all([
      User.findOne({ uid: customerId }),
      Turf.findById(turfId),
    ]);

    // Look up owner — try by MongoDB _id first (Turf.ownerId is an ObjectId), fallback to Firebase UID
    let owner = null;
    try {
      owner = await User.findById(ownerId);
    } catch {
      // ownerId is not a valid ObjectId, try as Firebase UID
    }
    if (!owner) {
      owner = await User.findOne({ uid: ownerId });
    }

    if (!customer || customer.role !== 'customer') {
      return NextResponse.json({ error: 'Invalid customer' }, { status: 400 });
    }

    if (!owner || owner.role !== 'owner') {
      return NextResponse.json({ error: 'Invalid turf owner' }, { status: 400 });
    }

    if (!turf) {
      return NextResponse.json({ error: 'Invalid turf' }, { status: 400 });
    }

    // Check if owner has verified bank details for receiving transfers
    if (!owner.razorpayLinkedAccountId) {
      console.warn('Turf owner does not have linked Razorpay account. Transfer will be manual.');
    }

    // Clean up stale pending_payment bookings (older than 10 minutes)
    // These are from users who started but never completed payment
    const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);
    await Booking.deleteMany({
      status: 'pending_payment',
      createdAt: { $lt: staleThreshold },
    });

    // Check slot availability (both bookings and reservations by other customers)
    const unavailableSlots = [];
    for (const slot of slots) {
      // Check for confirmed bookings (any customer)
      const confirmedBooking = await Booking.findOne({
        turfId,
        'slot.day': slot.day,
        'slot.date': slot.date,
        'slot.startTime': slot.startTime,
        'slot.endTime': slot.endTime,
        status: 'confirmed',
      });

      if (confirmedBooking) {
        unavailableSlots.push(slot);
        continue;
      }

      // Check for pending_payment bookings by OTHER customers (still within 10-min window)
      const pendingBooking = await Booking.findOne({
        turfId,
        'slot.day': slot.day,
        'slot.date': slot.date,
        'slot.startTime': slot.startTime,
        'slot.endTime': slot.endTime,
        status: 'pending_payment',
        customerId: { $ne: customer._id },
      });

      if (pendingBooking) {
        unavailableSlots.push(slot);
        continue;
      }

      // Check reservations by other customers
      // Note: SlotReservation stores customerId as Firebase UID (from frontend)
      const existingReservation = await SlotReservation.findOne({
        turfId,
        'slot.day': slot.day,
        'slot.date': slot.date,
        'slot.startTime': slot.startTime,
        'slot.endTime': slot.endTime,
        customerId: { $ne: customerId }, // customerId here is the Firebase UID from request
      });

      if (existingReservation) {
        unavailableSlots.push(slot);
      }
    }

    if (unavailableSlots.length > 0) {
      return NextResponse.json(
        {
          error: 'Some slots are no longer available',
          unavailableSlots,
          code: 'SLOT_CONFLICT',
        },
        { status: 409 }
      );
    }

    // Step 2.5: Calculate Loyalty Discount
    let loyaltyDiscountAmount = 0;
    let appliedLoyaltyPoints = 0;
    let finalAmount = parseFloat(totalAmount.toString());

    if (useLoyaltyPoints && customer.loyaltyPoints > 0) {
      // 10 points = 1 rupee
      const calculatedDiscount = customer.loyaltyPoints / 10;
      loyaltyDiscountAmount = Math.min(calculatedDiscount, finalAmount); // Cannot exceed total amount
      appliedLoyaltyPoints = loyaltyDiscountAmount * 10;
      finalAmount = finalAmount - loyaltyDiscountAmount;
    }

    // Reserve slots for this customer (10-minute window)
    const reservationExpiry = new Date(Date.now() + 10 * 60 * 1000);
    try {
      // Clear any existing reservations for this customer on this turf
      // Uses Firebase UID (customerId) since that's what reserve-slots stores
      await SlotReservation.deleteMany({
        customerId: customerId, // Firebase UID
        turfId,
      });

      // Also clean up this customer's old pending_payment bookings for this turf
      // (from abandoned payment attempts) — uses MongoDB ObjectId
      await Booking.deleteMany({
        customerId: customer._id,
        turfId,
        status: 'pending_payment',
      });

      // Create new reservations using Firebase UID (consistent with reserve-slots)
      const reservations = slots.map((slot: any) => ({
        customerId: customerId, // Firebase UID
        turfId,
        slot,
        expiresAt: reservationExpiry,
      }));

      await SlotReservation.insertMany(reservations);
    } catch (reserveError: any) {
      // If reservation fails due to duplicate key, slots were just taken
      if (reserveError.code === 11000) {
        return NextResponse.json(
          { error: 'Some slots were just reserved by another customer', code: 'SLOT_CONFLICT' },
          { status: 409 }
        );
      }
      throw reserveError;
    }

    // Create Razorpay order (receipt max 40 chars)
    const shortId = customer._id.toString().slice(-8);
    const receipt = `bk_${shortId}_${Date.now()}`;
    const order = await createOrder(finalAmount, 'INR', receipt, {
      customerId: customer._id.toString(),
      ownerId: owner._id.toString(),
      turfId,
      slotCount: slots.length.toString(),
      appliedLoyaltyPoints: appliedLoyaltyPoints.toString(),
      loyaltyDiscountAmount: loyaltyDiscountAmount.toString()
    });

    // Create booking records with pending_payment status
    const amountPerSlot = parseFloat(finalAmount.toString()) / slots.length;
    const originalAmountPerSlot = parseFloat(totalAmount.toString()) / slots.length;
    const loyaltyPointsPerSlot = appliedLoyaltyPoints / slots.length;
    const discountPerSlot = loyaltyDiscountAmount / slots.length;
    const createdBookings = [];

    for (const slot of slots) {
      const booking = new Booking({
        customerId: customer._id,
        ownerId: owner._id,
        turfId,
        slot,
        totalAmount: originalAmountPerSlot, // store the original price per slot
        appliedLoyaltyPoints: loyaltyPointsPerSlot,
        loyaltyDiscountAmount: discountPerSlot,
        status: 'pending_payment',
        paymentStatus: 'pending',
        razorpayOrderId: order.id,
      });

      await booking.save();
      createdBookings.push(booking);
    }

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        amount: finalAmount, // send the Final discounted amount
        originalAmount: parseFloat(totalAmount.toString()),
        loyaltyDiscountAmount,
        appliedLoyaltyPoints,
        currency: 'INR',
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        bookingIds: createdBookings.map((b) => b._id.toString()),
        slotCount: slots.length,
        expiresAt: reservationExpiry.toISOString(),
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone || '',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error', details: error?.description || error?.error?.description || undefined },
      { status: 500 }
    );
  }
}