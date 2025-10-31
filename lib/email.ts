import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Note: Removed transporter.verify() as it causes DYNAMIC_SERVER_USAGE error in Next.js App Router
// Verification will happen automatically when sending emails

interface BookingDetails {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  turfName: string;
  turfLocation: string;
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  bookingId: string;
}

/**
 * Send booking notification email to turf owner
 */
export async function sendBookingNotificationEmail(
  ownerEmail: string,
  ownerName: string,
  bookingDetails: BookingDetails
): Promise<void> {
  try {
    const { 
      customerName, 
      customerEmail, 
      customerPhone,
      turfName, 
      turfLocation,
      bookingDate, 
      bookingTime, 
      totalAmount,
      bookingId 
    } = bookingDetails;

    const mailOptions = {
      from: `"OutFyld Notifications" <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      subject: `🔔 New Booking Request - ${turfName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
            }
            .booking-card {
              background: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .booking-detail {
              display: flex;
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .booking-detail:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: bold;
              width: 150px;
              color: #555;
            }
            .value {
              color: #333;
              flex: 1;
            }
            .amount {
              font-size: 24px;
              color: #28a745;
              font-weight: bold;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              margin: 10px 5px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              text-align: center;
            }
            .button-approve {
              background-color: #28a745;
              color: white;
            }
            .button-view {
              background-color: #667eea;
              color: white;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .alert {
              background: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 4px;
              padding: 15px;
              margin: 20px 0;
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 New Booking Request!</h1>
              <p style="margin: 10px 0 0 0;">You have a new booking request for your turf</p>
            </div>
            
            <div class="content">
              <p>Hello <strong>${ownerName}</strong>,</p>
              <p>Great news! You have received a new booking request for <strong>${turfName}</strong>.</p>
              
              <div class="alert">
                ⏰ <strong>Action Required:</strong> Please review and approve/reject this booking request as soon as possible.
              </div>

              <div class="booking-card">
                <h2 style="margin-top: 0; color: #667eea;">📋 Booking Details</h2>
                
                <div class="booking-detail">
                  <span class="label">Booking ID:</span>
                  <span class="value"><code>${bookingId}</code></span>
                </div>
                
                <div class="booking-detail">
                  <span class="label">Customer Name:</span>
                  <span class="value">${customerName}</span>
                </div>
                
                <div class="booking-detail">
                  <span class="label">Customer Email:</span>
                  <span class="value">${customerEmail}</span>
                </div>
                
                ${customerPhone ? `
                <div class="booking-detail">
                  <span class="label">Customer Phone:</span>
                  <span class="value">${customerPhone}</span>
                </div>
                ` : ''}
                
                <div class="booking-detail">
                  <span class="label">Turf:</span>
                  <span class="value">${turfName}</span>
                </div>
                
                <div class="booking-detail">
                  <span class="label">Location:</span>
                  <span class="value">${turfLocation}</span>
                </div>
                
                <div class="booking-detail">
                  <span class="label">Date:</span>
                  <span class="value">${bookingDate}</span>
                </div>
                
                <div class="booking-detail">
                  <span class="label">Time Slot:</span>
                  <span class="value">${bookingTime}</span>
                </div>
                
                <div class="booking-detail">
                  <span class="label">Amount:</span>
                  <span class="value amount">₹${totalAmount}</span>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/owner/dashboard" class="button button-view">
                  View Booking Dashboard
                </a>
              </div>

              <p style="color: #666; font-size: 14px;">
                💡 <strong>Tip:</strong> The customer has already made the payment. Please verify the payment screenshot in your dashboard before approving the booking.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>OutFyld</strong> - Your Turf Management Platform</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
              <p style="margin-top: 10px;">
                Need help? Contact us at admin@outfyld.in
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Booking Request - ${turfName}

Hello ${ownerName},

You have received a new booking request:

Booking ID: ${bookingId}
Customer: ${customerName}
Email: ${customerEmail}
${customerPhone ? `Phone: ${customerPhone}` : ''}
Turf: ${turfName}
Location: ${turfLocation}
Date: ${bookingDate}
Time: ${bookingTime}
Amount: ₹${totalAmount}

Please log in to your dashboard to review and approve/reject this booking.

Dashboard URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/owner/dashboard

Best regards,
OutFyld Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking notification email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending booking notification email:', error);
    throw error;
  }
}

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmationEmail(
  customerEmail: string,
  customerName: string,
  bookingDetails: BookingDetails,
  status: 'confirmed' | 'rejected'
): Promise<void> {
  try {
    const { turfName, bookingDate, bookingTime, totalAmount } = bookingDetails;
    
    const isConfirmed = status === 'confirmed';
    const subject = isConfirmed 
      ? `✅ Booking Confirmed - ${turfName}` 
      : `❌ Booking Rejected - ${turfName}`;
    
    const mailOptions = {
      from: `"OutFyld" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: ${isConfirmed ? '#28a745' : '#dc3545'};
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isConfirmed ? '✅ Booking Confirmed!' : '❌ Booking Rejected'}</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>${isConfirmed 
                ? `Your booking for <strong>${turfName}</strong> has been confirmed!` 
                : `We regret to inform you that your booking for <strong>${turfName}</strong> has been rejected.`
              }</p>
              ${isConfirmed ? `
                <p><strong>Booking Details:</strong></p>
                <ul>
                  <li>Date: ${bookingDate}</li>
                  <li>Time: ${bookingTime}</li>
                  <li>Amount: ₹${totalAmount}</li>
                </ul>
                <p>See you on the turf!</p>
              ` : `
                <p>Your payment will be refunded within 5-7 business days.</p>
              `}
            </div>
            <div class="footer">
              <p>OutFyld - Your Turf Booking Platform</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Booking ${status} email sent to customer`);
  } catch (error) {
    console.error('Error sending customer email:', error);
    throw error;
  }
}

export default transporter;
