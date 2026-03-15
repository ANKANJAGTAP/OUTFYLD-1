import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geocoding';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, city, state, pincode } = body;

    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }

    const result = await geocodeAddress({ address, city, state, pincode });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: error.message || 'Geocoding failed' },
      { status: 500 }
    );
  }
}