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
    page.drawText('OUTFYLD', {
      x: 50,
      y: 780,
      size: 28,
      font: helveticaBold,
      color: rgb(0.12, 0.64, 0.28), // primary green
    });
    
    page.drawText('BOOKING RECEIPT', {
      x: 350,
      y: 780,
      size: 20,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Receipt ID: ${booking._id.toString().slice(0, 8).toUpperCase()}`, {
        x: 350,
        y: 755,
        size: 10,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4),
    });
    
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
        x: 350,
        y: 740,
        size: 10,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4),
    });

    // Customer Info
    page.drawText('Billed To:', { x: 50, y: 720, size: 10, font: helveticaBold, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(booking.customerId?.name || 'Guest User', { x: 50, y: 705, size: 12, font: helveticaBold });
    page.drawText(booking.customerId?.email || '', { x: 50, y: 690, size: 10, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
    if (booking.customerId?.phone) {
        page.drawText(booking.customerId.phone, { x: 50, y: 675, size: 10, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
    }

    // Divider
    page.drawLine({
      start: { x: 50, y: 650 },
      end: { x: 545, y: 650 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Table Header
    let yOffset = 620;
    page.drawText('Item Description', { x: 50, y: yOffset, size: 10, font: helveticaBold, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('Qty/Slots', { x: 350, y: yOffset, size: 10, font: helveticaBold, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('Amount', { x: 480, y: yOffset, size: 10, font: helveticaBold, color: rgb(0.4, 0.4, 0.4) });
    
    // Divider
    yOffset -= 15;
    page.drawLine({
      start: { x: 50, y: yOffset },
      end: { x: 545, y: yOffset },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Main Item
    yOffset -= 25;
    const turfName = booking.turfId?.businessName || booking.turfId?.name || 'OutFyld Turf';
    page.drawText(`Turf Booking: ${turfName}`, { x: 50, y: yOffset, size: 12, font: helveticaBold });
    page.drawText(`Date: ${booking.slot.date}`, { x: 50, y: yOffset - 15, size: 10, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
    
    const slotsInfo = allBookingsForOrder.length > 1 
      ? `${allBookingsForOrder.length} slots` 
      : `${booking.slot.startTime} - ${booking.slot.endTime}`;
      
    page.drawText(slotsInfo, { x: 350, y: yOffset, size: 11, font: helvetica });
    page.drawText(`INR ${totalBaseAmount.toFixed(2)}`, { x: 480, y: yOffset, size: 11, font: helvetica });

    // Summary Section
    yOffset -= 80;
    page.drawLine({
      start: { x: 320, y: yOffset },
      end: { x: 545, y: yOffset },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    yOffset -= 25;
    const drawSummaryRow = (label: string, value: string, isBold: boolean = false, isGreen: boolean = false) => {
        const font = isBold ? helveticaBold : helvetica;
        const color = isGreen ? rgb(0.12, 0.64, 0.28) : rgb(0.2, 0.2, 0.2);
        page.drawText(label, { x: 320, y: yOffset, size: 11, font });
        // Align text to right roughly
        page.drawText(value, { x: 480, y: yOffset, size: 11, font, color });
        yOffset -= 20;
    };

    drawSummaryRow('Subtotal:', `INR ${totalBaseAmount.toFixed(2)}`);
    
    let totalDiscount = 0;
    if (totalPromoDiscount > 0) {
        drawSummaryRow('Promo Discount:', `- INR ${totalPromoDiscount.toFixed(2)}`, false, true);
        totalDiscount += totalPromoDiscount;
    } 
    // Removed 'else', so it can stack!
    if (totalDynamicDiscount > 0) {
        drawSummaryRow('Dynamic Discount:', `- INR ${totalDynamicDiscount.toFixed(2)}`, false, true);
        totalDiscount += totalDynamicDiscount;
    }
    
    if (totalLoyaltyDiscount > 0) {
        drawSummaryRow('Loyalty Used:', `- INR ${totalLoyaltyDiscount.toFixed(2)}`, false, true);
        totalDiscount += totalLoyaltyDiscount;
    }
    
    yOffset -= 5;
    page.drawLine({
      start: { x: 320, y: yOffset + 15 },
      end: { x: 545, y: yOffset + 15 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    
    const totalPaid = totalBaseAmount - totalDiscount;
    drawSummaryRow('Total Paid:', `INR ${totalPaid.toFixed(2)}`, true);
    
    // Status and Payment info
    yOffset -= 20;
    page.drawText('Payment Info', { x: 50, y: yOffset + 160, size: 10, font: helveticaBold, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`Status: ${booking.status.toUpperCase()}`, { x: 50, y: yOffset + 145, size: 10, font: helvetica, color: booking.status === 'confirmed' ? rgb(0.12, 0.64, 0.28) : rgb(0.4, 0.4, 0.4) });
    page.drawText(`Method: Razorpay`, { x: 50, y: yOffset + 130, size: 10, font: helvetica });
    page.drawText(`Reference: ${booking.razorpayPaymentId || 'N/A'}`, { x: 50, y: yOffset + 115, size: 10, font: helvetica });

    // Footer
    page.drawText('Thank you for booking with OUTFYLD!', { 
      x: 50, 
      y: 50, 
      size: 10, 
      font: helveticaBold,
      color: rgb(0.4, 0.4, 0.4)
    });
    page.drawText('For any queries, please contact support@outfyld.in', { 
      x: 50, 
      y: 35, 
      size: 9, 
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5)
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Error generating receipt:', error);
    return null;
  }
}
