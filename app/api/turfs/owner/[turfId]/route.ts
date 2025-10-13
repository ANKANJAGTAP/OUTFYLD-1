import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Turf from '@/app/models/Turf';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { turfId: string } }
) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token and get UID
    let uid: string;
    try {
      const [, payload] = idToken.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      uid = decoded.uid || decoded.user_id;
    } catch (error) {
      console.error('Error parsing token payload:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectMongoDB();

    const turfId = params.turfId;

    // Find the turf - ensure it belongs to this owner
    const turf = await Turf.findOne({ _id: turfId, ownerUid: uid });
    
    if (!turf) {
      return NextResponse.json(
        { error: 'Turf not found or you do not have permission to access it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      turf
    });

  } catch (error: any) {
    console.error('Error fetching turf:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
