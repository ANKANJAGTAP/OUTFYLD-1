import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Turf from '@/app/models/Turf';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const sportsParam = searchParams.get('sports') || searchParams.get('sport') || '';
    const amenitiesParam = searchParams.get('amenities') || '';
    const city = searchParams.get('city') || '';
    const minPrice = parseInt(searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '10000');
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const sortBy = searchParams.get('sortBy') || 'newest';

    // Build query for active turfs
    const query: any = {
      isActive: true
    };

    // Add filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { 'contactInfo.businessName': { $regex: search, $options: 'i' } }
      ];
    }

    // Handle multiple sports
    if (sportsParam && sportsParam !== 'all') {
      const sports = sportsParam.split(',').map((s: string) => s.trim()).filter((s: string) => s);
      if (sports.length > 0) {
        query.sportsOffered = { $in: sports };
      }
    }

    // Handle multiple amenities
    if (amenitiesParam) {
      const amenities = amenitiesParam.split(',').map((a: string) => a.trim()).filter((a: string) => a);
      if (amenities.length > 0) {
        query.amenities = { $all: amenities };
      }
    }

    if (city && city !== 'all') {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    if (minPrice > 0 || maxPrice < 10000) {
      query.pricing = { $gte: minPrice, $lte: maxPrice };
    }

    // Add rating filter
    if (minRating > 0) {
      query.rating = { $gte: minRating };
    }

    // Sort options
    const sortOptions: any = {};
    switch (sortBy) {
      case 'price_low':
        sortOptions.pricing = 1;
        break;
      case 'price_high':
        sortOptions.pricing = -1;
        break;
      case 'rating':
        sortOptions.rating = -1;
        break;
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    try {
      // Get turfs with pagination
      const turfs = await Turf.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select('-paymentInfo.upiQrCode') // Don't send UPI QR codes in browse
        .lean();

      // Get total count
      const total = await Turf.countDocuments(query);

      // Transform data for frontend
      const transformedTurfs = turfs.map((turf: any) => ({
        _id: turf._id,
        name: turf.name,
        description: turf.description,
        businessName: turf.contactInfo.businessName,
        featuredImage: turf.featuredImage,
        images: turf.images,
        sportsOffered: turf.sportsOffered,
        customSport: turf.customSport,
        amenities: turf.amenities,
        pricing: turf.pricing,
        rating: turf.rating || 0,
        reviewCount: turf.reviewCount || 0,
        location: turf.location,
        availableSlots: turf.availableSlots,
        contactInfo: {
          phone: turf.contactInfo.phone,
          businessName: turf.contactInfo.businessName
        },
        owner: turf.ownerId,
        createdAt: turf.createdAt,
        updatedAt: turf.updatedAt
      }));

      // Get available filters data
      const cities = await Turf.distinct('location.city', {
        isActive: true,
        'location.city': { $exists: true, $ne: '' }
      });

      const allSports = await Turf.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$sportsOffered' },
        { $group: { _id: '$sportsOffered', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const sports = allSports.map((item: any) => item._id).filter((sport: any) => sport !== 'Other');

      return NextResponse.json({
        turfs: transformedTurfs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        },
        filters: {
          cities: cities.filter((city: any) => city),
          sports,
          priceRange: {
            min: await Turf.find(query).sort({ pricing: 1 }).limit(1).select('pricing').then((res: any) => res[0]?.pricing || 0),
            max: await Turf.find(query).sort({ pricing: -1 }).limit(1).select('pricing').then((res: any) => res[0]?.pricing || 10000)
          }
        }
      });

    } catch (mongoError: any) {
      console.error('❌ Error in Turf query:', mongoError);
      console.error('Error name:', mongoError?.name);
      console.error('Error message:', mongoError?.message);
      console.error('Stack trace:', mongoError?.stack);
      
      // Only return mock data if it's actually a connection error
      if (mongoError?.name === 'MongoNetworkError' || 
          mongoError?.name === 'MongoServerSelectionError' ||
          mongoError?.message?.includes('ENOTFOUND') ||
          mongoError?.message?.includes('connection')) {
        console.log('MongoDB connection error - returning mock data for development');
      
      // Return mock data if MongoDB connection fails
      const mockTurfs = [
        {
          _id: 'mock1',
          name: 'Green Valley Sports Complex',
          description: 'Premium football turf with professional quality grass and excellent facilities.',
          businessName: 'Green Valley Sports',
          featuredImage: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500',
          images: [
            { url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500', public_id: 'mock1' }
          ],
          sportsOffered: ['Football', 'Cricket'],
          amenities: ['Floodlights', 'Parking', 'Washroom'],
          pricing: 800,
          rating: 4.5,
          reviewCount: 24,
          location: {
            city: 'Mumbai',
            address: '123 Sports Avenue',
            state: 'Maharashtra',
            pincode: '400001'
          },
          availableSlots: [
            { day: 'Monday', startTime: '06:00', endTime: '22:00' },
            { day: 'Tuesday', startTime: '06:00', endTime: '22:00' }
          ],
          contactInfo: {
            phone: '+91 9876543210',
            businessName: 'Green Valley Sports'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      return NextResponse.json({
        turfs: mockTurfs,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 12,
          hasNextPage: false,
          hasPrevPage: false
        },
        filters: {
          cities: ['Mumbai', 'Delhi', 'Bangalore'],
          sports: ['Football', 'Cricket', 'Badminton', 'Tennis'],
          priceRange: { min: 500, max: 2000 }
        }
      });
      } else {
        // For other errors, re-throw them to be caught by outer catch
        throw mongoError;
      }
    }

  } catch (error: any) {
    console.error('Error fetching turfs:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}