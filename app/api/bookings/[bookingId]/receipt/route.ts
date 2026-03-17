import { NextRequest, NextResponse } from 'next/server';
import { getBookingReceiptBuffer } from '@/lib/receiptGenerator';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const pdfBuffer = await getBookingReceiptBuffer(params.bookingId);
    if (!pdfBuffer) {
      return NextResponse.json({ error: 'Failed to generate receipt or booking not found' }, { status: 404 });
    }

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receipt_${params.bookingId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
