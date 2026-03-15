import { NextRequest, NextResponse } from 'next/server';
import transporter from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * GET /api/test-email
 * Test endpoint to verify email functionality
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to') || 'test@example.com';

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: 'Test Email from Turf Booking System',
      text: 'This is a test email to verify email functionality.',
      html: '<h1>Test Email</h1><p>This is a test email to verify email functionality.</p>'
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${to}`
    });

  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
