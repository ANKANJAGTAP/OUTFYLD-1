import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Booking from '@/app/models/Booking';
import User from '@/app/models/User';
import Turf from '@/app/models/Turf';
import { v2 as cloudinary } from 'cloudinary';
import { sendBookingNotificationEmail } from '@/lib/email';
import { sendBookingNotificationSMS } from '@/lib/sms';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    console.log('1. Starting booking creation process...');
    await connectMongoDB();
    console.log('2. Connected to MongoDB');

    const formData = await request.formData();
    console.log('3. Parsed form data');
    
    const customerId = formData.get('customerId') as string;
    const ownerId = formData.get('ownerId') as string;
    const turfId = formData.get('turfId') as string;
    const slotsData = formData.get('slots') as string; // Changed from 'slot' to 'slots'
    const totalAmount = formData.get('totalAmount') as string;
    const paymentScreenshot = formData.get('paymentScreenshot') as File;

    console.log('4. Form data extracted:', { customerId, ownerId, turfId, slotsData, totalAmount, hasFile: !!paymentScreenshot });

    // Validate required fields
    if (!customerId || !ownerId || !turfId || !slotsData || !totalAmount || !paymentScreenshot) {
      console.log('5. Validation failed - missing fields');
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    console.log('6. All required fields present');

    // Parse slots data (expecting array)
    let slots: Array<{ day: string; date: string; startTime: string; endTime: string }>;
    try {
      slots = JSON.parse(slotsData);
      console.log('7. Slots data parsed successfully:', slots);
      
      // Validate it's an array
      if (!Array.isArray(slots) || slots.length === 0) {
        throw new Error('Slots must be a non-empty array');
      }
    } catch (error) {
      console.log('7. Failed to parse slots data:', error);
      return NextResponse.json(
        { error: 'Invalid slots data format' },
        { status: 400 }
      );
    }

    // Validate all slots have required fields
    for (const slot of slots) {
      if (!slot.day || !slot.date || !slot.startTime || !slot.endTime) {
        console.log('8. Invalid slot structure:', slot);
        return NextResponse.json(
          { error: 'Each slot must contain day, date, startTime, and endTime' },
          { status: 400 }
        );
      }
    }

    console.log('9. All slots structure valid, count:', slots.length);

    // Verify that the customer, owner, and turf exist
    console.log('10. Looking up users and turf...');
    const [customer, owner, turf] = await Promise.all([
      User.findOne({ uid: customerId }), // Find customer by Firebase UID
      User.findOne({ uid: ownerId }), // Find owner by Firebase UID
      Turf.findById(turfId) // Find turf by MongoDB ObjectId
    ]);

    console.log('11. Database lookup results:', { 
      customerFound: !!customer, 
      ownerFound: !!owner, 
      turfFound: !!turf,
      customerUid: customer?.uid,
      customerMongoId: customer?._id,
      ownerMongoId: owner?._id
    });

    if (!customer || customer.role !== 'customer') {
      return NextResponse.json(
        { error: 'Invalid customer' },
        { status: 400 }
      );
    }

    if (!owner || owner.role !== 'owner') {
      return NextResponse.json(
        { error: 'Invalid turf owner' },
        { status: 400 }
      );
    }

    if (!turf) {
      return NextResponse.json(
        { error: 'Invalid turf' },
        { status: 400 }
      );
    }

    // Check if any of the slots are already booked
    console.log('11. Checking slot availability...');
    const unavailableSlots = [];
    
    for (const slot of slots) {
      const existingBooking = await Booking.findOne({
        turfId,
        'slot.day': slot.day,
        'slot.date': slot.date,
        'slot.startTime': slot.startTime,
        'slot.endTime': slot.endTime,
        status: { $in: ['pending', 'confirmed'] }
      });

      if (existingBooking) {
        unavailableSlots.push(slot);
      }
    }

    if (unavailableSlots.length > 0) {
      console.log('11. Some slots are unavailable:', unavailableSlots);
      return NextResponse.json(
        { 
          error: 'Some slots are no longer available',
          unavailableSlots,
          code: 'SLOT_CONFLICT'
        },
        { status: 409 }
      );
    }

    console.log('11. All slots are available');

    // Upload payment screenshot to Cloudinary
    console.log('12. Uploading payment screenshot...');
    const bytes = await paymentScreenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'arenax/payment-screenshots',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    }) as any;

    console.log('13. Payment screenshot uploaded');

    // Create bookings for each slot (each slot is a separate booking)
    console.log('14. Creating bookings for', slots.length, 'slots');
    
    const amountPerSlot = parseFloat(totalAmount) / slots.length;
    const createdBookings: any[] = [];
    
    for (const slot of slots) {
      const booking = new Booking({
        customerId: customer._id,
        ownerId: owner._id,
        turfId,
        slot,
        totalAmount: amountPerSlot,
        paymentScreenshot: {
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id
        }
      });

      await booking.save();
      createdBookings.push(booking);
    }

    console.log('15. All bookings created successfully:', createdBookings.length);

    // Populate the first booking with user and turf details for response
    const populatedBooking = await Booking.findById(createdBookings[0]._id)
      .populate('customerId', 'name email phone')
      .populate('ownerId', 'name email businessName phone')
      .populate('turfId', 'name contactInfo description location pricing');

    console.log('16. Booking details populated, sending notifications...');

    // Send notifications to turf owner (async, don't block response)
    // This runs in background - failures won't affect booking creation
    setImmediate(async () => {
      try {
        const ownerData = populatedBooking.ownerId as any;
        const turfData = populatedBooking.turfId as any;
        const customerData = populatedBooking.customerId as any;

        // Create time slots summary
        const timeSlotsText = slots.map(s => `${s.startTime} - ${s.endTime}`).join(', ');
        const bookingDate = slots[0].date; // All slots should be for the same date
        const bookingDay = slots[0].day;

        const bookingDetails = {
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          turfName: turfData.name || turfData.contactInfo?.businessName,
          turfLocation: `${turfData.location?.city || ''}, ${turfData.location?.state || ''}`.trim(),
          bookingDate: `${bookingDay}, ${bookingDate}`,
          bookingTime: timeSlotsText,
          totalAmount: parseFloat(totalAmount),
          bookingId: createdBookings.map(b => b._id.toString()).join(', '),
        };

        // Send email notification
        if (ownerData.email) {
          try {
            await sendBookingNotificationEmail(
              ownerData.email,
              ownerData.name || 'Owner',
              bookingDetails
            );
            console.log('✅ Email notification sent to owner');
          } catch (emailError) {
            console.error('❌ Failed to send email notification:', emailError);
          }
        }

        // Send SMS notification
        if (ownerData.phone) {
          try {
            await sendBookingNotificationSMS(
              ownerData.phone,
              ownerData.name || 'Owner',
              bookingDetails
            );
            console.log('✅ SMS notification sent to owner');
          } catch (smsError) {
            console.error('❌ Failed to send SMS notification:', smsError);
          }
        }

        console.log('17. Notifications processing completed');
      } catch (notificationError) {
        console.error('Error in notification process:', notificationError);
        // Don't throw - notifications are non-critical
      }
    });

    // Clean up slot reservations after successful booking
    try {
      const SlotReservation = (await import('@/app/models/SlotReservation')).default;
      await SlotReservation.deleteMany({ 
        customerId: customer._id, 
        turfId 
      });
      console.log('18. Slot reservations cleaned up');
    } catch (cleanupError) {
      console.error('Error cleaning up slot reservations:', cleanupError);
      // Don't throw - cleanup is non-critical
    }

    return NextResponse.json({
      message: `${createdBookings.length} booking(s) created successfully`,
      bookings: createdBookings.map(b => ({
        _id: b._id,
        slot: b.slot,
        totalAmount: b.totalAmount,
        status: b.status
      })),
      booking: populatedBooking // Keep for backward compatibility
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating booking:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}