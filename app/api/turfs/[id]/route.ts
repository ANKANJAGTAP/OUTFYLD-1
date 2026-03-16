import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Turf from '@/app/models/Turf';
import Booking from '@/app/models/Booking';
import { calculateAllPeriodDiscounts, getBestDiscount } from '@/lib/pricingEngine';

export const dynamic = 'force-dynamic';

// ─── Lean document types ─────────────────────────────────────────────

interface LeanTurf {
  _id: any;
  ownerId: any;
  ownerUid: string;
  name: string;
  description: string;
  images: Array<{ url: string; public_id: string }>;
  featuredImage?: string;
  sportsOffered: string[];
  customSport?: string;
  amenities: string[];
  availableSlots: Array<{ day: string; startTime: string; endTime: string }>;
  pricing: number;
  maxDiscount: number;
  location: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    coordinates?: { latitude?: number; longitude?: number };
  };
  geoLocation?: {
    type: string;
    coordinates: [number, number];
  };
  contactInfo: {
    phone: string;
    email: string;
    businessName: string;
    ownerName?: string;
  };
  paymentInfo?: any;
  isActive: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface LeanBooking {
  _id: any;
  slot: {
    day: string;
    startTime: string;
    endTime: string;
    date: string;
  };
}

interface LeanUserTurf {
  _id: any;
  uid?: string;
  role?: string;
  name?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  about?: string;
  turfImages?: any[];
  sportsOffered?: string[];
  customSport?: string;
  amenities?: string[];
  pricing?: number;
  location?: any;
  upiQrCode?: any;
  availableSlots?: Array<{ day: string; startTime: string; endTime: string }>;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Helper: get upcoming date range ─────────────────────────────────

function getUpcomingDateRange(days: number): { todayStr: string; futureStr: string } {
  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + days);
  return {
    todayStr: today.toISOString().split('T')[0],
    futureStr: future.toISOString().split('T')[0],
  };
}

// ─── Helper: fetch upcoming bookings ─────────────────────────────────

async function getUpcomingBookedSlots(turfId: string): Promise<Set<string>> {
  const { todayStr, futureStr } = getUpcomingDateRange(14);

  const confirmedBookings = await Booking.find({
    turfId,
    status: { $in: ['confirmed', 'pending_payment'] },
    'slot.date': { $gte: todayStr, $lte: futureStr },
  })
    .select('slot')
    .lean() as unknown as LeanBooking[];   // ✅ type assertion instead of generic

  return new Set(
    confirmedBookings.map(
      (b) => `${b.slot.date}-${b.slot.startTime}-${b.slot.endTime}`
    )
  );
}

// ─── GET Handler ─────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB();

    const { id } = params;
    console.log('Fetching turf with ID:', id);

    // ✅ Use `as` instead of .lean<LeanTurf>()
    const turf = await Turf.findById(id).lean() as unknown as LeanTurf | null;
    console.log('Turf found:', turf ? 'Yes' : 'No');

    if (!turf) {
      // ─── Fallback: try User collection for backward compatibility ──
      const User = require('@/app/models/User').default;
      // ✅ Use `as` instead of .lean<LeanUserTurf>()
      const userTurf = await User.findById(id).lean() as unknown as LeanUserTurf | null;
      console.log('User turf found:', userTurf ? 'Yes' : 'No');

      if (!userTurf || userTurf.role !== 'owner') {
        return NextResponse.json(
          { error: 'Turf not found' },
          { status: 404 }
        );
      }

      const bookedSlots = await getUpcomingBookedSlots(id);

      const slotsWithAvailability = (userTurf.availableSlots || []).map(
        (slot) => ({
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })
      );

      const turfData = {
        _id: userTurf._id,
        ownerId: userTurf.uid,
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
        updatedAt: userTurf.updatedAt,
      };

      return NextResponse.json({ turf: turfData });
    }

    // ─── Main turf found ───────────────────────────────────────────

    const bookedSlots = await getUpcomingBookedSlots(id);

    const slotsWithAvailability = (turf.availableSlots || []).map((slot) => ({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));

    // Calculate per-period dynamic pricing
    const periodDiscounts = await calculateAllPeriodDiscounts(turf);
    const bestOffer = getBestDiscount(periodDiscounts);

    const turfData = {
      _id: turf._id,
      ownerId: turf.ownerUid,
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
      offerPrice: bestOffer.offerPrice,
      discountPercent: bestOffer.discountPercent,
      discountAmount: bestOffer.discountAmount,
      offerLabel:
        bestOffer.discountPercent > 0
          ? `Up to ${bestOffer.discountPercent}% OFF`
          : '',
      location: turf.location,
      geoLocation: turf.geoLocation,
      contactInfo: turf.contactInfo,
      paymentInfo: turf.paymentInfo,
      upiQrCode: turf.paymentInfo?.upiQrCode,
      availableSlots: slotsWithAvailability,
      isActive: turf.isActive,
      rating: turf.rating,
      reviewCount: turf.reviewCount,
      createdAt: turf.createdAt,
      updatedAt: turf.updatedAt,
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