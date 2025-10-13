import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Settings from '@/app/models/Settings';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/settings
 * Get admin settings including payment QR code
 */
export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    // Get the first (and should be only) settings document
    let settings = await Settings.findOne();

    // If no settings exist, return null
    if (!settings) {
      return NextResponse.json({
        success: true,
        settings: null,
        message: 'No settings found. Admin should upload payment QR code.'
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        adminPaymentQR: settings.adminPaymentQR,
        updatedAt: settings.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings
 * Update admin settings (payment QR code)
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminPaymentQR, adminUid } = body;

    if (!adminPaymentQR || !adminPaymentQR.url || !adminPaymentQR.public_id) {
      return NextResponse.json(
        { error: 'Admin payment QR code is required' },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Find existing settings or create new one
    let settings = await Settings.findOne();

    if (settings) {
      // Update existing settings
      settings.adminPaymentQR = adminPaymentQR;
      settings.updatedBy = adminUid;
      settings.updatedAt = new Date();
      await settings.save();
    } else {
      // Create new settings
      settings = new Settings({
        adminPaymentQR,
        updatedBy: adminUid,
        updatedAt: new Date()
      });
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Admin payment QR code updated successfully',
      settings: {
        adminPaymentQR: settings.adminPaymentQR,
        updatedAt: settings.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
