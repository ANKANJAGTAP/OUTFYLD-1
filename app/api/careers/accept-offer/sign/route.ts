import { NextRequest, NextResponse } from 'next/server';
import JobApplication from '@/app/models/JobApplication';
import { connectMongoDB } from '@/lib/mongodb';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/careers/accept-offer/sign
 * Upload digital signature and mark as signed
 */
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { applicationId, signature } = body;

    if (!applicationId || !signature) {
      return NextResponse.json(
        { error: 'Application ID and signature are required' },
        { status: 400 }
      );
    }

    const application: any = await JobApplication.findById(applicationId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Upload signature to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(signature, {
      folder: 'outfyld/signatures',
      resource_type: 'image',
      public_id: `signature-${applicationId}`,
    });

    // Update application with signature
    application.signatureUrl = uploadResult.secure_url;
    application.signedAt = new Date();
    await application.save();

    return NextResponse.json({
      success: true,
      message: 'Signature saved successfully',
      signatureUrl: uploadResult.secure_url
    });

  } catch (error) {
    console.error('Error saving signature:', error);
    return NextResponse.json(
      { error: 'Failed to save signature' },
      { status: 500 }
    );
  }
}
