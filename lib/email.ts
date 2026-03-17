import nodemailer from 'nodemailer';

// Check if email is configured
const isEmailConfigured = !!(
  process.env.EMAIL_HOST && 
  process.env.EMAIL_USER && 
  process.env.EMAIL_PASSWORD
);

if (!isEmailConfigured) {
  console.warn('⚠️  Email not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env.local');
}

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  debug: process.env.SMTP_DEBUG === 'true', // Enable debug output
  logger: process.env.SMTP_LOGGER === 'true', // Enable logger
});

// Note: Removed transporter.verify() as it causes DYNAMIC_SERVER_USAGE error in Next.js App Router
// Verification will happen automatically when sending emails

console.log('📧 Email transporter initialized:', {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || '587',
  secure: process.env.EMAIL_SECURE === 'true',
  user: process.env.EMAIL_USER ? '✓ configured' : '✗ missing',
  password: process.env.EMAIL_PASSWORD ? '✓ configured' : '✗ missing',
});

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
  // Check if email is enabled
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
    console.log('📧 Email notifications disabled. Set ENABLE_EMAIL_NOTIFICATIONS=true to enable.');
    return;
  }

  if (!isEmailConfigured) {
    console.warn('⚠️  Cannot send email: Email not configured');
    return;
  }

  try {
    console.log(`📧 Sending booking notification to owner: ${ownerEmail}`);
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

    const senderName = process.env.EMAIL_SENDER_NAME || 'OutFyld Notifications';
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@outfyld.in';
    
    const mailOptions = {
      from: `"${senderName}" <${fromEmail}>`,
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
      <h1>✅ Booking Confirmed!</h1>
      <p style="margin: 10px 0 0 0;">A booking has been successfully confirmed for your turf</p>
    </div>

    <div class="content">
      <p>Hello <strong>${ownerName}</strong>,</p>
      <p>Good news! A booking has been successfully completed for <strong>${turfName}</strong>.</p>

      <div class="alert">
        📅 <strong>Upcoming Booking:</strong> Please make sure the turf is ready for the scheduled time.
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
          <span class="label">Amount Paid:</span>
          <span class="value amount">₹${totalAmount}</span>
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/owner/dashboard" class="button button-view">
          View Booking Dashboard
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        💡 <strong>Note:</strong> The payment for this booking has already been completed by the customer.
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
    console.log('✅ Booking notification email sent successfully');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Sent to:', ownerEmail);
  } catch (error: any) {
    console.error('❌ Error sending owner notification email:', error);
    console.error('Error details:', {
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode
    });
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
  // Check if email is enabled
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
    console.log('📧 Email notifications disabled. Set ENABLE_EMAIL_NOTIFICATIONS=true to enable.');
    return;
  }

  if (!isEmailConfigured) {
    console.warn('⚠️  Cannot send email: Email not configured');
    return;
  }

  try {
    console.log(`📧 Sending booking ${status} email to customer: ${customerEmail}`);
    const { turfName, bookingDate, bookingTime, totalAmount } = bookingDetails;
    
    const isConfirmed = status === 'confirmed';
    const subject = isConfirmed 
      ? `✅ Booking Confirmed - ${turfName}` 
      : `❌ Booking Rejected - ${turfName}`;
    
    const senderName = process.env.EMAIL_SENDER_NAME || 'OutFyld';
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@outfyld.in';
    
    const mailOptions = {
      from: `"${senderName}" <${fromEmail}>`,
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

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Booking ${status} email sent to customer successfully`);
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Sent to:', customerEmail);
  } catch (error: any) {
    console.error('❌ Error sending customer email:', error);
    console.error('Error details:', {
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode
    });
    throw error;
  }
}

export async function sendFeedbackRequestEmail(
  customerEmail: string,
  customerName: string,
  turfName: string,
  bookingId: string
) {
  try {
    const feedbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://outfyld.in'}/feedback/${bookingId}`;
    
    const mailOptions = {
      from: `"OutFyld Support" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `How was your experience at ${turfName}?`,
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border-top: 4px solid #10b981; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981; margin-top: 0;">We'd love your feedback!</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Hi ${customerName},</p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
              We hope you had a great time playing at <strong>${turfName}</strong>. 
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
              Your feedback is incredibly valuable to us and helps other players make better decisions. Please take a moment to rate your experience.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${feedbackUrl}" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Leave a Review</a>
            </div>
            
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              Thanks for choosing OutFyld!
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              If you have any questions, reply to this email or contact support at <a href="mailto:admin@outfyld.in" style="color: #10b981; text-decoration: none;">admin@outfyld.in</a>
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Feedback request email sent to customer successfully`);
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Sent to:', customerEmail);
  } catch (error: any) {
    console.error('❌ Error sending feedback request email:', error);
  }
}

export default transporter;
