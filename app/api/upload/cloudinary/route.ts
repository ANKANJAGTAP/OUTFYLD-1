import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

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
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'turf_booking/upi_qr_codes';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine transformation based on folder
    let transformation: any = [
      { width: 500, height: 500, crop: 'limit' },
      { quality: 'auto' }
    ];

    if (folder.includes('turf_banners')) {
      // Banners need to be high resolution (e.g. 1920 width) without heavy compression
      transformation = [
        { width: 1920, crop: 'limit' },
        { quality: 100 }
      ];
    } else if (folder.includes('turf_images')) {
      // Standard turf images can comfortably sit at 1200px width
      transformation = [
        { width: 1200, crop: 'limit' },
        { quality: 'auto' }
      ];
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: folder,
          transformation: transformation
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      url: (result as any).secure_url,
      public_id: (result as any).public_id,
    });

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}