import { connectMongoDB } from '@/lib/mongodb';
import Booking from '@/app/models/Booking';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function getBookingReceiptBuffer(bookingId: string): Promise<Buffer | null> {
  try {
    await connectMongoDB();

    const booking: any = await Booking.findById(bookingId)
      .populate('turfId', 'name businessName location')
      .populate('customerId', 'name email phone')
      .populate('ownerId', 'name businessName');

    if (!booking) {
      return null;
    }

    // Find all bookings for this order
    let allBookingsForOrder = [booking];
    try {
      if (booking.razorpayOrderId) {
        allBookingsForOrder = await Booking.find({
          razorpayOrderId: booking.razorpayOrderId
        });
      }
    } catch(e) {}
    
    // Aggregation
    let totalBaseAmount = 0;
    let totalPromoDiscount = 0;
    let totalDynamicDiscount = 0;
    let totalLoyaltyDiscount = 0;
    
    for (const b of allBookingsForOrder) {
      totalBaseAmount += (b.totalAmount || 0);
      totalPromoDiscount += (b.promoDiscountAmount || 0);
      totalDynamicDiscount += (b.dynamicDiscountAmount || 0);
      totalLoyaltyDiscount += (b.loyaltyDiscountAmount || 0);
    }
    
    // Generate PDF Receipt
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Header
    page.drawText('OUTFYLD - Booking Receipt', {
      x: 50,
      y: 780,
      size: 24,
      font: helveticaBold,
      color: rgb(0, 0.5, 0),
    });

    page.drawText(`Receipt ID: ${booking._id.toString().slice(0, 8).toUpperCase()}`, {
        x: 50,
        y: 750,
        size: 12,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3),
    });

    let yOffset = 700;
    const lineSpacing = 25;

    const drawRow = (label: string, value: string) => {
        page.drawText(label, { x: 50, y: yOffset, size: 12, font: helveticaBold });
        page.drawText(value, { x: 200, y: yOffset, size: 12, font: helvetica });
        yOffset -= lineSpacing;
    };

    drawRow('Turf:', booking.turfId?.businessName || booking.turfId?.name || 'OutFyld Turf');
    drawRow('Date:', booking.slot.date);
    
    if (allBookingsForOrder.length > 1) {
        drawRow('Time Slots:', `${allBookingsForOrder.length} slots booked`);
    } else {
        drawRow('Time Slot:', `${booking.slot.startTime} - ${booking.slot.endTime}`);
    }
    
    drawRow('Status:', booking.status.toUpperCase());
    yOffset -= 15;
    
    drawRow('Base Amount:', `INR ${totalBaseAmount}`);
    
    let totalDiscount = 0;
    if (totalPromoDiscount > 0) {
        drawRow('Promo Discount:', `- INR ${totalPromoDiscount}`);
        totalDiscount += totalPromoDiscount;
    } else if (totalDynamicDiscount > 0) {
        drawRow('Special Discount:', `- INR ${totalDynamicDiscount}`);
        totalDiscount += totalDynamicDiscount;
    }
    
    if (totalLoyaltyDiscount > 0) {
        drawRow('Loyalty Used:', `- INR ${totalLoyaltyDiscount}`);
        totalDiscount += totalLoyaltyDiscount;
    }
    
    yOffset -= 15;
    const totalPaid = totalBaseAmount - totalDiscount;
    drawRow('Total Paid:', `INR ${totalPaid}`);
    
    yOffset -= 15;
    drawRow('Payment Method:', 'Razorpay');
    drawRow('Payment Ref:', booking.razorpayPaymentId || 'N/A');

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Error generating receipt:', error);
    return null;
  }
}
