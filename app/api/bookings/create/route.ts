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
    const slotData = formData.get('slot') as string;
    const totalAmount = formData.get('totalAmount') as string;
    const paymentScreenshot = formData.get('paymentScreenshot') as File;

    console.log('4. Form data extracted:', { customerId, ownerId, turfId, slotData, totalAmount, hasFile: !!paymentScreenshot });

    // Validate required fields
    if (!customerId || !ownerId || !turfId || !slotData || !totalAmount || !paymentScreenshot) {
      console.log('5. Validation failed - missing fields');
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    console.log('6. All required fields present');

    // Parse slot data
    let slot: { day: string; startTime: string; endTime: string };
    try {
      slot = JSON.parse(slotData);
      console.log('7. Slot data parsed successfully:', slot);
    } catch (error) {
      console.log('7. Failed to parse slot data:', error);
      return NextResponse.json(
        { error: 'Invalid slot data format' },
        { status: 400 }
      );
    }

    // Validate slot structure
    if (!slot.day || !slot.startTime || !slot.endTime) {
      console.log('8. Invalid slot structure:', slot);
      return NextResponse.json(
        { error: 'Slot must contain day, startTime, and endTime' },
        { status: 400 }
      );
    }

    console.log('9. Slot structure valid');

    // Verify that the customer, owner, and turf exist
    console.log('10. Looking up users and turf...');
    const [customer, owner, turf] = await Promise.all([
      User.findOne({ uid: customerId }), // Find customer by Firebase UID
      User.findById(ownerId), // Find owner by MongoDB ObjectId
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

    // Check if the slot is available
    const existingBooking = await Booking.findOne({
      turfId,
      'slot.day': slot.day,
      'slot.startTime': slot.startTime,
      'slot.endTime': slot.endTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'This slot is no longer available' },
        { status: 409 }
      );
    }

    // Upload payment screenshot to Cloudinary
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

    // Create the booking
    console.log('12. Creating booking with IDs:', {
      customerMongoId: customer._id,
      ownerId,
      turfId
    });
    
    const booking = new Booking({
      customerId: customer._id, // Use customer's MongoDB ObjectId
      ownerId,
      turfId,
      slot,
      totalAmount: parseFloat(totalAmount),
      paymentScreenshot: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      }
    });

    await booking.save();

    // Populate the booking with user and turf details for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('customerId', 'name email phone')
      .populate('ownerId', 'name email businessName phone')
      .populate('turfId', 'name contactInfo description location pricing');

    console.log('13. Booking created successfully, sending notifications...');

    // Send notifications to turf owner (async, don't block response)
    // This runs in background - failures won't affect booking creation
    setImmediate(async () => {
      try {
        const ownerData = populatedBooking.ownerId as any;
        const turfData = populatedBooking.turfId as any;
        const customerData = populatedBooking.customerId as any;

        const bookingDetails = {
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          turfName: turfData.name || turfData.contactInfo?.businessName,
          turfLocation: `${turfData.location?.city || ''}, ${turfData.location?.state || ''}`.trim(),
          bookingDate: slot.day,
          bookingTime: `${slot.startTime} - ${slot.endTime}`,
          totalAmount: parseFloat(totalAmount),
          bookingId: booking._id.toString(),
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

        console.log('14. Notifications processing completed');
      } catch (notificationError) {
        console.error('Error in notification process:', notificationError);
        // Don't throw - notifications are non-critical
      }
    });

    return NextResponse.json({
      message: 'Booking created successfully',
      booking: populatedBooking
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