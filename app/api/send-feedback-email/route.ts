import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Tell Next.js this route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { customerEmail, customerName, turfName, bookingId, turfId } = await req.json();

    if (!customerEmail || !customerName || !turfName || !bookingId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Create feedback URL with booking details
    const feedbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/feedback/${bookingId}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .stars {
            font-size: 24px;
            color: #f59e0b;
            margin: 15px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
                        <h1>🎉 Thank You for Booking with OutFyld!</h1>
          </div>
          <div class="content">
            <h2>Hi ${customerName}! 👋</h2>
            <p>We hope you had an amazing experience at <strong>${turfName}</strong>!</p>
            
            <p>Your feedback is incredibly valuable to us and helps other customers make informed decisions. It also helps turf owners improve their facilities and services.</p>
            
            <div class="stars">⭐ ⭐ ⭐ ⭐ ⭐</div>
            
            <p><strong>We'd love to hear about your experience!</strong></p>
            
            <div style="text-align: center;">
              <a href="${feedbackUrl}" class="button">
                Rate Your Experience
              </a>
            </div>
            
            <p style="margin-top: 20px;">The feedback process takes less than 2 minutes:</p>
            <ul>
              <li>✅ Rate the turf quality (1-5 stars)</li>
              <li>✅ Share your experience</li>
              <li>✅ Help others find great turfs</li>
            </ul>
            
            <p>Thank you for being a part of our community! 🙏</p>
            
                        <p><strong>The OutFyld Team</strong></p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            
            <p style="font-size: 14px; color: #666;">
              <strong>Booking Reference:</strong> #${bookingId.slice(0, 8).toUpperCase()}<br>
              <strong>Turf:</strong> ${turfName}
            </p>
          </div>
          <div class="footer">
            <p>OutFyld - Your Premier Turf Booking Platform</p>
            <p>Sangli & Miraj</p>
            <p>This is an automated email. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Hi ${customerName}!

We hope you had an amazing experience at ${turfName}!

Your feedback is incredibly valuable to us. Please take a moment to rate your experience:

${feedbackUrl}

Thank you for being a part of our community!

The OutFyld Team

Booking Reference: #${bookingId.slice(0, 8).toUpperCase()}
Turf: ${turfName}
    `;

    await transporter.sendMail({
      from: `"OutFyld" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `🌟 Rate Your Experience at ${turfName} - OutFyld`,
      html: htmlContent,
      text: textContent,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback request email sent successfully' 
    });
  } catch (error: any) {
    console.error('Error sending feedback email:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
