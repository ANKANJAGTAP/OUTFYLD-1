import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Turf from '@/app/models/Turf';
import Booking from '@/app/models/Booking';
import { calculateAllPeriodDiscounts, getBestDiscount } from '@/lib/pricingEngine';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB();

    const { id } = params;
    console.log('Fetching turf with ID:', id);

    // Find the turf by ID
    const turf = await Turf.findById(id);
    console.log('Turf found:', turf ? 'Yes' : 'No');
    
    if (!turf) {
      // Try to find in User collection as fallback for backward compatibility
      const User = require('@/app/models/User').default;
      const userTurf = await User.findById(id);
      console.log('User turf found:', userTurf ? 'Yes' : 'No');
      
      if (!userTurf || userTurf.role !== 'owner') {
        return NextResponse.json(
          { error: 'Turf not found' },
          { status: 404 }
        );
      }
      
      // Use User data with compatibility mapping
      const confirmedBookings = await Booking.find({
        turfId: id,
        status: 'confirmed'
      }).select('slot');

      const bookedSlots = new Set(
        confirmedBookings.map(booking => 
          `${booking.slot.day}-${booking.slot.startTime}-${booking.slot.endTime}`
        )
      );

      const slotsWithAvailability = userTurf.availableSlots?.map((slot: any) => {
        const slotKey = `${slot.day}-${slot.startTime}-${slot.endTime}`;
        return {
          ...slot.toObject(),
          isBooked: bookedSlots.has(slotKey)
        };
      }) || [];

      const turfData = {
        _id: userTurf._id,
        ownerId: userTurf.uid, // Use Firebase UID for booking API
        name: userTurf.name || userTurf.businessName,
        businessName: userTurf.businessName,
        email: userTurf.email,
        phone: userTurf.phone,
        description: userTurf.about,
        about: userTurf.about,
        images: userTurf.turfImages || [],
        turfImages: userTurf.turfImages || [],
        sportsOffered: userTurf.sportsOffered || [],
        customSport: userTurf.customSport,
        amenities: userTurf.amenities || [],
        pricing: userTurf.pricing || 0,
        location: userTurf.location || {},
        upiQrCode: userTurf.upiQrCode,
        availableSlots: slotsWithAvailability,
        createdAt: userTurf.createdAt,
        updatedAt: userTurf.updatedAt
      };

      return NextResponse.json({
        turf: turfData
      });
    }

    // Get all confirmed bookings for this turf
    const confirmedBookings = await Booking.find({
      turfId: id,
      status: 'confirmed'
    }).select('slot');

    // Create a map of booked slots for easy lookup
    const bookedSlots = new Set(
      confirmedBookings.map(booking => 
        `${booking.slot.day}-${booking.slot.startTime}-${booking.slot.endTime}`
      )
    );

    // Mark available slots as booked or available
    const slotsWithAvailability = turf.availableSlots?.map((slot: any) => {
      const slotKey = `${slot.day}-${slot.startTime}-${slot.endTime}`;
      return {
        ...slot.toObject(),
        isBooked: bookedSlots.has(slotKey)
      };
    }) || [];

    // Prepare turf data with availability info and backward compatibility
    // Calculate per-period dynamic pricing for this turf
    const periodDiscounts = await calculateAllPeriodDiscounts(turf);
    const bestOffer = getBestDiscount(periodDiscounts);

    const turfData = {
      _id: turf._id,
      ownerId: turf.ownerUid, // Use Firebase UID for booking API
      name: turf.name,
      businessName: turf.contactInfo?.businessName || turf.name,
      email: turf.contactInfo?.email || '',
      phone: turf.contactInfo?.phone || '',
      description: turf.description,
      about: turf.description,
      images: turf.images,
      turfImages: turf.images,
      featuredImage: turf.featuredImage,
      sportsOffered: turf.sportsOffered,
      customSport: turf.customSport,
      amenities: turf.amenities,
      pricing: turf.pricing,
      maxDiscount: turf.maxDiscount || 0,
      // Best offer fields (for header display)
      offerPrice: bestOffer.offerPrice,
      discountPercent: bestOffer.discountPercent,
      discountAmount: bestOffer.discountAmount,
      offerLabel: bestOffer.discountPercent > 0 ? `Up to ${bestOffer.discountPercent}% OFF` : '',
      location: turf.location,
      contactInfo: turf.contactInfo,
      paymentInfo: turf.paymentInfo,
      upiQrCode: turf.paymentInfo?.upiQrCode,
      availableSlots: slotsWithAvailability,
      isActive: turf.isActive,
      rating: turf.rating,
      reviewCount: turf.reviewCount,
      createdAt: turf.createdAt,
      updatedAt: turf.updatedAt
    };

    return NextResponse.json({
      turf: turfData,
      periodDiscounts,
    });

  } catch (error) {
    console.error('Error fetching turf details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}