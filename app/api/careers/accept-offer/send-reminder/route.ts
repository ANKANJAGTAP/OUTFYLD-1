import { NextRequest, NextResponse } from 'next/server';
import JobApplication from '@/app/models/JobApplication';
import { connectMongoDB } from '@/lib/mongodb';
import nodemailer from 'nodemailer';

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * POST /api/careers/accept-offer/send-reminder
 * Send reminder emails to candidates who haven't completed acceptance within 24 hours
 */
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    // Find applications with pending acceptance status and 24+ hours old
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const pendingApplications = await JobApplication.find({
      offerAcceptanceStatus: 'pending',
      offerLetterGeneratedAt: { $lte: twentyFourHoursAgo },
      offerExpiryDate: { $gt: new Date() }, // Not expired yet
      paymentStatus: { $ne: 'completed' } // Payment not completed
    }).populate('jobId');

    let sentCount = 0;
    const errors = [];

    for (const application of pendingApplications) {
      try {
        const daysRemaining = Math.ceil(
          (new Date(application.offerExpiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );

        const mailOptions = {
          from: `"OutFyld HR Team" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
          to: application.email,
          subject: `⏰ Reminder: Complete Your Offer Acceptance - ${application.jobId?.title || 'Internship'}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
                .button { display: inline-block; background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
                .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🏏 OUTFYLD</h1>
                  <p style="margin: 5px 0 0 0;">Play. Connect. Compete.</p>
                </div>
                
                <div class="content">
                  <h2 style="color: #16a34a;">Reminder: Complete Your Offer Acceptance</h2>
                  
                  <p>Dear <strong>${application.fullName}</strong>,</p>
                  
                  <p>This is a friendly reminder that your offer for the position of <strong>${application.jobId?.title || 'Intern'}</strong> is awaiting your acceptance.</p>
                  
                  <div class="warning">
                    <p style="margin: 0; font-weight: 600; color: #92400e;">⏰ Time Sensitive</p>
                    <p style="margin: 5px 0 0 0; color: #92400e;">Your offer will expire in <strong>${daysRemaining} day(s)</strong>. Please complete the acceptance process soon to secure your position.</p>
                  </div>
                  
                  <p><strong>Your Offer Letter ID:</strong> ${application.offerLetterId}</p>
                  
                  <p><strong>Steps to complete:</strong></p>
                  <ol>
                    <li>Verify your details</li>
                    <li>Provide digital signature</li>
                    <li>Complete onboarding payment (₹249)</li>
                  </ol>
                  
                  <div style="text-align: center;">
                    <a href="${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_APP_URL || 'https://outfyld.in')}/careers/accept-offer/${application._id}" 
                       class="button">
                      Complete Acceptance Process
                    </a>
                  </div>
                  
                  <p>If you have any questions or need assistance, please contact us at <a href="mailto:hr@outfyld.in">hr@outfyld.in</a></p>
                  
                  <p>Best regards,<br>
                  <strong>HR Team</strong><br>
                  OutFyld</p>
                </div>
                
                <div class="footer">
                  <p>© ${new Date().getFullYear()} OutFyld. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        };

        await transporter.sendMail(mailOptions);
        sentCount++;
        console.log(`✅ Reminder sent to ${application.email}`);
      } catch (emailError) {
        console.error(`❌ Failed to send reminder to ${application.email}:`, emailError);
        errors.push({ email: application.email, error: emailError });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} reminder emails out of ${pendingApplications.length} pending applications`,
      sentCount,
      totalPending: pendingApplications.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error sending reminder emails:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder emails' },
      { status: 500 }
    );
  }
}
