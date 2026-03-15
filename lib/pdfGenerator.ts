import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface OfferLetterData {
  candidateName: string;
  offerLetterId: string;
  jobTitle: string;
  department: string;
  employmentType: string;
  location: string;
  stipendAmount: string;
  stipendType: string;
  startDate: string;
  endDate: string;
  issueDate: string;
}

interface JoiningLetterData {
  candidateName: string;
  offerLetterId: string;
  position: string;
  department: string;
  startDate: Date;
  salary: number;
}

interface PaymentReceiptData {
  candidateName: string;
  email: string;
  offerLetterId: string;
  position: string;
  transactionId: string;
  paymentDate: Date;
  amount: number;
}

/**
 * Helper function to embed logo in PDF
 */
async function embedLogo(pdfDoc: PDFDocument) {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    const logoBytes = fs.readFileSync(logoPath);
    const logoImage = await pdfDoc.embedPng(Uint8Array.from(logoBytes));
    return logoImage;
  } catch (error) {
    console.error('Error embedding logo:', error);
    return null;
  }
}

/**
 * Generate Offer Letter PDF matching OUTFYLD format
 */
export async function generateOfferLetterPDF(data: OfferLetterData): Promise<{ url: string; public_id: string; buffer: Buffer }> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    
    // Embed fonts
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    
    // Embed logo
    const logo = await embedLogo(pdfDoc);
    
    const { width, height } = page.getSize();
    let yPosition = height - 60;
    
    // Draw logo and OUTFYLD text
    if (logo) {
      const logoDims = logo.scale(0.08); // Even smaller scale to ensure it fits
      page.drawImage(logo, {
        x: 60,
        y: yPosition - 20,
        width: logoDims.width,
        height: logoDims.height,
      });
      
      // Add OUTFYLD text next to logo
      page.drawText('OUTFYLD', {
        x: 60 + logoDims.width + 10,
        y: yPosition - 5,
        size: 18,
        font: helveticaBold,
        color: rgb(0.086, 0.639, 0.290),
      });
      
      yPosition -= 30; // Adjust position after logo and text
    } else {
      // Fallback to text if logo not available
      page.drawText('OUTFYLD', {
        x: 60,
        y: yPosition,
        size: 20,
        font: helveticaBold,
        color: rgb(0.086, 0.639, 0.290),
      });
    }
    
    // Tagline
    page.drawText('Grow Faster. Learn Smarter', {
      x: 60,
      y: yPosition - 15,
      size: 9,
      font: helveticaOblique,
      color: rgb(0.42, 0.447, 0.502),
    });
    
    // Contact Info (right side)
    page.drawText('+91 70382 02440', {
      x: 400,
      y: yPosition,
      size: 8,
      font: helvetica,
      color: rgb(0.42, 0.447, 0.502), // #6b7280 gray
    });
    
    page.drawText('admin@outfyld.in', {
      x: 400,
      y: yPosition - 12,
      size: 8,
      font: helvetica,
      color: rgb(0.42, 0.447, 0.502),
    });
    
    page.drawText('www.outfyld.in', {
      x: 400,
      y: yPosition - 24,
      size: 8,
      font: helvetica,
      color: rgb(0.42, 0.447, 0.502),
    });
    
    // Line separator
    yPosition -= 45;
    page.drawLine({
      start: { x: 60, y: yPosition },
      end: { x: 535, y: yPosition },
      thickness: 1,
      color: rgb(0.82, 0.835, 0.843), // #d1d5db
    });
    
    // Date and ID
    yPosition -= 25;
    page.drawText(`Date: ${data.issueDate}`, {
      x: 60,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`ID: ${data.offerLetterId}`, {
      x: 400,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    // Greeting
    yPosition -= 30;
    page.drawText('Dear,', {
      x: 60,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    // Candidate Name - Bold and Blue
    yPosition -= 25;
    page.drawText(data.candidateName.toUpperCase(), {
      x: 60,
      y: yPosition,
      size: 16,
      font: helveticaBold,
      color: rgb(0.118, 0.227, 0.541), // #1e3a8a blue
    });
    
    // Line under name
    yPosition -= 15;
    page.drawLine({
      start: { x: 60, y: yPosition },
      end: { x: 400, y: yPosition },
      thickness: 1,
      color: rgb(0.82, 0.835, 0.843),
    });
    
    // Offer paragraph
    yPosition -= 25;
    const offerText1 = 'I am pleased to offer you the position of ';
    const offerText2 = `${data.jobTitle} (${data.department})`;
    const offerText3 = ' Intern at OutFyld. After careful';
    const offerText4 = 'consideration of your application and assessment performance, we are confident in your';
    const offerText5 = 'abilities and believe you will make a valuable contribution to our team.';
    
    page.drawText(offerText1, { x: 60, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    page.drawText(offerText2, { x: 60 + helvetica.widthOfTextAtSize(offerText1, 11), y: yPosition, size: 11, font: helveticaBold, color: rgb(0.118, 0.227, 0.541) });
    
    yPosition -= 15;
    page.drawText(offerText4, { x: 60, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    yPosition -= 15;
    page.drawText(offerText5, { x: 60, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    // Description paragraph
    yPosition -= 25;
    const isPaid = !data.stipendType.toLowerCase().includes('unpaid');
    const desc1 = `This is a part-time, ${isPaid ? 'paid' : 'unpaid'} internship, and you will work remotely. You will have the`;
    const desc2 = 'opportunity to collaborate closely with the OutFyld leadership team, as well as other members';
    const desc3 = 'of the team, to gain hands-on experience in a dynamic sports-tech environment.';
    
    page.drawText(desc1, { x: 60, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    yPosition -= 15;
    page.drawText(desc2, { x: 60, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    yPosition -= 15;
    page.drawText(desc3, { x: 60, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    // Internship Details Section
    yPosition -= 30;
    page.drawText('INTERNSHIP DETAILS:', {
      x: 60,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: rgb(0.118, 0.227, 0.541),
    });
    
    yPosition -= 20;
    page.drawText('- Position: ', { x: 60, y: yPosition, size: 11, font: helveticaBold, color: rgb(0, 0, 0) });
    page.drawText(`${data.jobTitle} Intern`, { x: 140, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    yPosition -= 18;
    page.drawText('- Working Hours: ', { x: 60, y: yPosition, size: 11, font: helveticaBold, color: rgb(0, 0, 0) });
    page.drawText('Flexible', { x: 170, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    yPosition -= 18;
    page.drawText('- Location: ', { x: 60, y: yPosition, size: 11, font: helveticaBold, color: rgb(0, 0, 0) });
    page.drawText(data.location, { x: 140, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    yPosition -= 18;
    page.drawText('- Duration: ', { x: 60, y: yPosition, size: 11, font: helveticaBold, color: rgb(0, 0, 0) });
    page.drawText(`${data.startDate} - ${data.endDate}`, { x: 140, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    if (isPaid) {
      yPosition -= 18;
      page.drawText('- Stipend: ', { x: 60, y: yPosition, size: 11, font: helveticaBold, color: rgb(0, 0, 0) });
      page.drawText(`${data.stipendAmount} (${data.stipendType})`, { x: 140, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    }
    
    // Acknowledgment text
    yPosition -= 35;
    const ack1 = 'Please acknowledge receipt of this offer letter and confirm your acceptance within 1 day. We';
    const ack2 = 'look forward to welcoming you to OutFyld and are excited about the contributions you will make!';
    
    page.drawText(ack1, { x: 60, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    yPosition -= 15;
    page.drawText(ack2, { x: 60, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    // Signature section
    yPosition -= 40;
    page.drawText('Best regards,', { x: 60, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    yPosition -= 20;
    page.drawText('HR Team', { x: 60, y: yPosition, size: 11, font: helveticaBold, color: rgb(0, 0, 0) });
    
    yPosition -= 15;
    page.drawText('OutFyld', { x: 60, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    yPosition -= 15;
    page.drawText('Email: admin@outfyld.in', { x: 60, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    yPosition -= 15;
    page.drawText('Website: www.outfyld.in', { x: 60, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    // Footer
    const footerText1 = 'This is a computer-generated document and does not require a physical signature.';
    const footerText2 = '© Copyright & Trademark Registered in India - OutFyld | All Rights Reserved';
    
    page.drawText(footerText1, {
      x: (width - helveticaOblique.widthOfTextAtSize(footerText1, 8)) / 2,
      y: 60,
      size: 8,
      font: helveticaOblique,
      color: rgb(0.42, 0.447, 0.502),
    });
    
    page.drawText(footerText2, {
      x: (width - helvetica.widthOfTextAtSize(footerText2, 8)) / 2,
      y: 45,
      size: 8,
      font: helvetica,
      color: rgb(0.42, 0.447, 0.502),
    });
    
    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);
    
    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'outfyld/offer-letters',
          resource_type: 'raw',
          public_id: `offer-letter-${data.offerLetterId}`,
          format: 'pdf'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              buffer: buffer
            });
          }
        }
      );
      
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Generate Joining Letter PDF after payment
 */
export async function generateJoiningLetterPDF(data: JoiningLetterData): Promise<{ url: string; public_id: string; buffer: Buffer }> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    
    // Embed fonts
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    
    // Embed logo
    const logo = await embedLogo(pdfDoc);
    
    const { width, height } = page.getSize();
    let yPosition = height - 60;
    
    // Draw logo and OUTFYLD text
    if (logo) {
      const logoDims = logo.scale(0.08); // Even smaller scale to ensure it fits
      page.drawImage(logo, {
        x: 60,
        y: yPosition - 20,
        width: logoDims.width,
        height: logoDims.height,
      });
      
      // Add OUTFYLD text next to logo
      page.drawText('OUTFYLD', {
        x: 60 + logoDims.width + 10,
        y: yPosition - 5,
        size: 18,
        font: helveticaBold,
        color: rgb(0.086, 0.639, 0.290),
      });
      
      yPosition -= 30;
    } else {
      // Fallback to text
      page.drawText('OUTFYLD', {
        x: 60,
        y: yPosition,
        size: 20,
        font: helveticaBold,
        color: rgb(0.086, 0.639, 0.290),
      });
    }
    
    // Tagline
    page.drawText('Grow Faster. Learn Smarter', {
      x: 60,
      y: yPosition - 15,
      size: 9,
      font: helveticaOblique,
      color: rgb(0.42, 0.447, 0.502),
    });
    
    // Contact Info
    page.drawText('+91 70382 02440', {
      x: 400,
      y: yPosition,
      size: 8,
      font: helvetica,
      color: rgb(0.42, 0.447, 0.502),
    });
    
    page.drawText('admin@outfyld.in', {
      x: 400,
      y: yPosition - 12,
      size: 8,
      font: helvetica,
      color: rgb(0.42, 0.447, 0.502),
    });
    
    page.drawText('www.outfyld.in', {
      x: 400,
      y: yPosition - 24,
      size: 8,
      font: helvetica,
      color: rgb(0.42, 0.447, 0.502),
    });
    
    // Line separator
    yPosition -= 45;
    page.drawLine({
      start: { x: 60, y: yPosition },
      end: { x: 535, y: yPosition },
      thickness: 1,
      color: rgb(0.82, 0.835, 0.843),
    });
    
    // Title - JOINING LETTER
    yPosition -= 40;
    const titleText = 'JOINING LETTER';
    page.drawText(titleText, {
      x: (width - helveticaBold.widthOfTextAtSize(titleText, 18)) / 2,
      y: yPosition,
      size: 18,
      font: helveticaBold,
      color: rgb(0.118, 0.227, 0.541),
    });
    
    // Date, Offer ID
    yPosition -= 40;
    const issueDate = new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    page.drawText(`Date: ${issueDate}`, {
      x: 60,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 18;
    page.drawText(`Offer ID: ${data.offerLetterId}`, {
      x: 60,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    // Line
    yPosition -= 15;
    page.drawLine({
      start: { x: 60, y: yPosition },
      end: { x: 535, y: yPosition },
      thickness: 1,
      color: rgb(0.82, 0.835, 0.843),
    });
    
    // Dear section
    yPosition -= 25;
    page.drawText('Dear,', {
      x: 60,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 25;
    page.drawText(data.candidateName.toUpperCase(), {
      x: 60,
      y: yPosition,
      size: 14,
      font: helveticaBold,
      color: rgb(0.118, 0.227, 0.541),
    });
    
    // Confirmation paragraph
    yPosition -= 35;
    const conf1 = 'Congratulations! We are delighted to confirm your joining as an intern with OutFyld.';
    page.drawText(conf1, {
      x: 60,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 25;
    page.drawText('Your internship details are as follows:', {
      x: 60,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    // Internship Details Box
    yPosition -= 35;
    const boxHeight = 120;
    page.drawRectangle({
      x: 80,
      y: yPosition - boxHeight,
      width: 450,
      height: boxHeight,
      borderColor: rgb(0.086, 0.639, 0.290),
      borderWidth: 2,
      color: rgb(0.941, 0.992, 0.957), // #f0fdf4 light green
    });
    
    const boxY = yPosition - 25;
    page.drawText('Position:', { x: 100, y: boxY, size: 11, font: helveticaBold, color: rgb(0, 0, 0) });
    page.drawText(data.position, { x: 250, y: boxY, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    page.drawText('Department:', { x: 100, y: boxY - 25, size: 11, font: helveticaBold, color: rgb(0, 0, 0) });
    page.drawText(data.department, { x: 250, y: boxY - 25, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    page.drawText('Start Date:', { x: 100, y: boxY - 50, size: 11, font: helveticaBold, color: rgb(0, 0, 0) });
    const formattedStartDate = new Date(data.startDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    page.drawText(formattedStartDate, { x: 250, y: boxY - 50, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    page.drawText('Work Mode:', { x: 100, y: boxY - 75, size: 11, font: helveticaBold, color: rgb(0, 0, 0) });
    page.drawText('Remote', { x: 250, y: boxY - 75, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    // Next Steps
    yPosition -= 170;
    page.drawText('Next Steps:', {
      x: 60,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: rgb(0.118, 0.227, 0.541),
    });
    
    yPosition -= 20;
    page.drawText('1. You will receive onboarding instructions via email within 2-3 business days.', {
      x: 60,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 18;
    page.drawText('2. Keep this joining letter for your records.', {
      x: 60,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 18;
    page.drawText('3. Our team will contact you with further details about your role and responsibilities.', {
      x: 60,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 30;
    page.drawText('We are excited to have you on board and looking forward to your contributions!', {
      x: 60,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    // Signature
    yPosition -= 40;
    page.drawText('Warm regards,', { x: 60, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    yPosition -= 20;
    page.drawText('HR Team', { x: 60, y: yPosition, size: 11, font: helveticaBold, color: rgb(0, 0, 0) });
    
    yPosition -= 15;
    page.drawText('OutFyld', { x: 60, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    yPosition -= 15;
    page.drawText('admin@outfyld.in', { x: 60, y: yPosition, size: 11, font: helvetica, color: rgb(0, 0, 0) });
    
    // Footer
    const footerText1 = 'This is an official document. Please retain for future reference.';
    const footerText2 = '© Copyright & Trademark Registered in India - OutFyld | All Rights Reserved';
    
    page.drawText(footerText1, {
      x: (width - helveticaOblique.widthOfTextAtSize(footerText1, 8)) / 2,
      y: 60,
      size: 8,
      font: helveticaOblique,
      color: rgb(0.42, 0.447, 0.502),
    });
    
    page.drawText(footerText2, {
      x: (width - helvetica.widthOfTextAtSize(footerText2, 8)) / 2,
      y: 45,
      size: 8,
      font: helvetica,
      color: rgb(0.42, 0.447, 0.502),
    });
    
    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);
    
    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'outfyld/joining-letters',
          resource_type: 'raw',
          public_id: `joining-letter-${data.offerLetterId}`,
          format: 'pdf'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              buffer: buffer
            });
          }
        }
      );
      
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Generate unique Offer Letter ID
 * Format: OUTFYLD-INF-2025-XXXXXX
 */
export function generateOfferLetterId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 900000) + 100000; // 6-digit random number
  return `OUTFYLD-INF-${year}-${randomNum}`;
}

/**
 * Generate Payment Receipt PDF
 */
export async function generatePaymentReceiptPDF(data: PaymentReceiptData): Promise<{ url: string; public_id: string; buffer: Buffer }> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Embed logo
    const logo = await embedLogo(pdfDoc);
    
    const { width, height } = page.getSize();
    let yPosition = height - 60;
    
    // Draw logo and OUTFYLD text
    if (logo) {
      const logoDims = logo.scale(0.08); // Even smaller scale to ensure it fits
      page.drawImage(logo, {
        x: 60,
        y: yPosition - 20,
        width: logoDims.width,
        height: logoDims.height,
      });
      
      // Add OUTFYLD text next to logo
      page.drawText('OUTFYLD', {
        x: 60 + logoDims.width + 10,
        y: yPosition - 5,
        size: 18,
        font: helveticaBold,
        color: rgb(0.086, 0.639, 0.290),
      });
      
      yPosition -= 30;
    } else {
      // Fallback to text
      page.drawText('OUTFYLD', {
        x: 60,
        y: yPosition,
        size: 32,
        font: helveticaBold,
        color: rgb(0.086, 0.639, 0.290),
      });
      yPosition -= 25;
    }
    
    page.drawText('Grow Faster. Learn Smarter', {
      x: 60,
      y: yPosition - 25,
      size: 10,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    // Receipt Title
    yPosition -= 80;
    page.drawRectangle({
      x: 60,
      y: yPosition - 5,
      width: width - 120,
      height: 40,
      color: rgb(0.941, 0.992, 0.957),
    });
    
    page.drawText('PAYMENT RECEIPT', {
      x: 220,
      y: yPosition + 10,
      size: 20,
      font: helveticaBold,
      color: rgb(0.086, 0.639, 0.290),
    });
    
    // Receipt Details
    yPosition -= 60;
    const formattedDate = new Date(data.paymentDate).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    page.drawText(`Date: ${formattedDate}`, {
      x: 60,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 18;
    page.drawText(`Transaction ID: ${data.transactionId}`, {
      x: 60,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 18;
    page.drawText(`Receipt ID: RCP-${data.transactionId.substring(0, 12).toUpperCase()}`, {
      x: 60,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    // Line separator
    yPosition -= 20;
    page.drawLine({
      start: { x: 60, y: yPosition },
      end: { x: 535, y: yPosition },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    
    // Candidate Details
    yPosition -= 30;
    page.drawText('Candidate Details:', {
      x: 60,
      y: yPosition,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 25;
    page.drawText(`Name: ${data.candidateName}`, {
      x: 80,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 20;
    page.drawText(`Email: ${data.email}`, {
      x: 80,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 20;
    page.drawText(`Position: ${data.position}`, {
      x: 80,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 20;
    page.drawText(`Offer Letter ID: ${data.offerLetterId}`, {
      x: 80,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    // Payment Details Box
    yPosition -= 50;
    page.drawRectangle({
      x: 60,
      y: yPosition - 120,
      width: width - 120,
      height: 140,
      borderColor: rgb(0.086, 0.639, 0.290),
      borderWidth: 2,
      color: rgb(0.941, 0.992, 0.957),
    });
    
    yPosition -= 20;
    page.drawText('Payment Breakdown:', {
      x: 80,
      y: yPosition,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 30;
    page.drawText('Processing Fee for Internship Onboarding', {
      x: 80,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    page.drawText('Rs.149.00', {
      x: 450,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 25;
    page.drawText('Certificate Issuance & Administration Fee', {
      x: 80,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    page.drawText('Rs.100.00', {
      x: 450,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 20;
    page.drawLine({
      start: { x: 80, y: yPosition },
      end: { x: 515, y: yPosition },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    yPosition -= 25;
    page.drawText('Total Amount Paid', {
      x: 80,
      y: yPosition,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Rs.${data.amount}.00`, {
      x: 430,
      y: yPosition,
      size: 13,
      font: helveticaBold,
      color: rgb(0.086, 0.639, 0.290),
    });
    
    // Payment Status
    yPosition -= 50;
    page.drawRectangle({
      x: 60,
      y: yPosition - 15,
      width: 200,
      height: 30,
      color: rgb(0.086, 0.639, 0.290),
    });
    
    page.drawText('PAYMENT SUCCESSFUL', {
      x: 75,
      y: yPosition - 5,
      size: 12,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });
    
    // Footer
    yPosition = 80;
    page.drawText('This is a computer-generated receipt and does not require a signature.', {
      x: 150,
      y: yPosition,
      size: 9,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    yPosition -= 20;
    page.drawText('For queries, contact: admin@outfyld.in', {
      x: 210,
      y: yPosition,
      size: 9,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);
    
    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'outfyld/payment-receipts',
          public_id: `receipt-${data.transactionId}`,
          resource_type: 'raw',
          format: 'pdf'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result!.secure_url,
              public_id: result!.public_id,
              buffer: buffer
            });
          }
        }
      );
      
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  } catch (error) {
    throw error;
  }
}
