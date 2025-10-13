import { NextRequest, NextResponse } from 'next/server';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization header found' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Debug: Parse the token payload (without verification for debugging)
    try {
      const [header, payload, signature] = idToken.split('.');
      const decodedHeader = JSON.parse(Buffer.from(header, 'base64').toString());
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
      
      return NextResponse.json({
        message: 'Token debug info',
        header: decodedHeader,
        payload: {
          uid: decodedPayload.uid || decodedPayload.user_id,
          email: decodedPayload.email,
          email_verified: decodedPayload.email_verified,
          iss: decodedPayload.iss,
          aud: decodedPayload.aud,
          exp: decodedPayload.exp,
          iat: decodedPayload.iat
        },
        rawPayload: decodedPayload
      });
    } catch (parseError: any) {
      return NextResponse.json({
        error: 'Failed to parse token',
        details: parseError?.message || 'Unknown parse error',
        tokenPreview: idToken.substring(0, 50) + '...'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error in token debug endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}