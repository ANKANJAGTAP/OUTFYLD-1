import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Turf from '@/app/models/Turf';
import User from '@/app/models/User';

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const sport = searchParams.get('sport') || '';
    const city = searchParams.get('city') || '';
    const minPrice = parseInt(searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '10000');
    const sortBy = searchParams.get('sortBy') || 'createdAt';

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

    if (sport && sport !== 'all') {
      query.sportsOffered = { $in: [sport] };
    }

    if (city && city !== 'all') {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    if (minPrice > 0 || maxPrice < 10000) {
      query.pricing = { $gte: minPrice, $lte: maxPrice };
    }

    if (minPrice > 0 || maxPrice < 10000) {
      query.pricing = { $gte: minPrice, $lte: maxPrice };
    }

    // Build sort object
    let sort: any = {};
    switch (sortBy) {
      case 'price-low':
        sort.pricing = 1;
        break;
      case 'price-high':
        sort.pricing = -1;
        break;
      case 'name':
        sort.businessName = 1;
        break;
      case 'newest':
        sort.createdAt = -1;
        break;
      default:
        sort.createdAt = -1;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [turfs, totalCount] = await Promise.all([
      User.find(query)
        .select({
          businessName: 1,
          upiQrCode: 1,
          turfImages: 1,
          sportsOffered: 1,
          customSport: 1,
          amenities: 1,
          about: 1,
          availableSlots: 1,
          pricing: 1,
          location: 1,
          createdAt: 1,
          updatedAt: 1,
          name: 1,
          phone: 1,
          email: 1
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    // Calculate additional metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Transform data for frontend
    const transformedTurfs = turfs.map((turf: any) => ({
      id: turf._id.toString(),
      name: turf.businessName,
      ownerName: turf.name,
      contact: turf.phone,
      email: turf.email,
      location: {
        address: turf.location?.address || '',
        city: turf.location?.city || '',
        state: turf.location?.state || '',
        pincode: turf.location?.pincode || ''
      },
      pricing: turf.pricing,
      sports: turf.sportsOffered.map((sport: string) => 
        sport === 'Other' ? turf.customSport || 'Other' : sport
      ),
      amenities: turf.amenities || [],
      about: turf.about,
      images: turf.turfImages.map((img: any) => ({
        url: img.url,
        public_id: img.public_id
      })),
      mainImage: turf.turfImages[0]?.url || '/placeholder-turf.jpg',
      upiQrCode: turf.upiQrCode,
      availableSlots: turf.availableSlots,
      rating: 4.5 + Math.random() * 0.5, // Mock rating for now
      reviewCount: Math.floor(Math.random() * 100) + 10, // Mock review count
      isAvailable: true,
      createdAt: turf.createdAt,
      updatedAt: turf.updatedAt
    }));

    // Get unique cities and sports for filters
    const [cities, allSports] = await Promise.all([
      User.distinct('location.city', { 
        role: 'owner', 
        isActive: true,
        'location.city': { $exists: true, $ne: '' }
      }),
      User.aggregate([
        { 
          $match: { 
            role: 'owner', 
            isActive: true,
            sportsOffered: { $exists: true, $not: { $size: 0 } }
          }
        },
        { $unwind: '$sportsOffered' },
        { $group: { _id: '$sportsOffered' } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const sports = allSports.map(item => item._id).filter(sport => sport !== 'Other');

    return NextResponse.json({
      success: true,
      data: {
        turfs: transformedTurfs,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          cities: cities.filter(city => city),
          sports: sports,
          priceRange: {
            min: await User.find(query).sort({ pricing: 1 }).limit(1).select('pricing').then(res => res[0]?.pricing || 0),
            max: await User.find(query).sort({ pricing: -1 }).limit(1).select('pricing').then(res => res[0]?.pricing || 10000)
          }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching turfs:', error);
    
    // If it's a MongoDB connection error, return mock data for development
    if (error instanceof Error && (
      error.message.includes('MongoDB') || 
      error.message.includes('MongooseServerSelectionError') ||
      error.message.includes('security-whitelist')
    )) {
      console.log('MongoDB connection error - returning mock data for development');
      return NextResponse.json({
        success: true,
        turfs: [
          {
            _id: 'mock-1',
            name: 'Demo User',
            businessName: 'Elite Sports Complex',
            location: { city: 'Mumbai', state: 'Maharashtra', address: '123 Sports Street' },
            pricing: { hourlyRate: 1200 },
            sportsOffered: ['Football', 'Cricket', 'Badminton'],
            turfImages: [{ url: '/placeholder-turf.jpg', public_id: 'mock-1' }],
            aboutTurf: 'Premium turf facility with modern amenities and professional-grade surfaces. Book now for the best sports experience!',
            amenities: ['Parking', 'Changing Rooms', 'Refreshments']
          },
          {
            _id: 'mock-2',
            name: 'Demo User 2',
            businessName: 'Champions Sports Arena',
            location: { city: 'Delhi', state: 'Delhi', address: '456 Victory Lane' },
            pricing: { hourlyRate: 1500 },
            sportsOffered: ['Basketball', 'Tennis'],
            turfImages: [{ url: '/placeholder-turf.jpg', public_id: 'mock-2' }],
            aboutTurf: 'State-of-the-art sports facility for serious athletes. Professional coaching available.',
            amenities: ['Air Conditioning', 'Equipment Rental', 'Lockers']
          },
          {
            _id: 'mock-3',
            name: 'Demo User 3',
            businessName: 'Victory Grounds',
            location: { city: 'Bangalore', state: 'Karnataka', address: '789 Champion Road' },
            pricing: { hourlyRate: 1000 },
            sportsOffered: ['Football', 'Hockey'],
            turfImages: [{ url: '/placeholder-turf.jpg', public_id: 'mock-3' }],
            aboutTurf: 'Affordable turf with quality facilities for all sports enthusiasts. Group discounts available.',
            amenities: ['First Aid', 'Spectator Seating', 'Parking']
          }
        ],
        total: 3,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 3,
          limit: 12,
          hasNextPage: false,
          hasPrevPage: false
        },
        filters: {
          cities: ['Mumbai', 'Delhi', 'Bangalore'],
          sports: ['Football', 'Cricket', 'Badminton', 'Basketball', 'Tennis', 'Hockey'],
          priceRange: { min: 1000, max: 1500 }
        }
      });
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch turfs. Please check your database connection.' 
      },
      { status: 500 }
    );
  }
}