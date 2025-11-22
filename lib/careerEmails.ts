import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Email configuration (reuse from main email.ts)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const isEmailConfigured = !!(
  process.env.EMAIL_HOST && 
  process.env.EMAIL_USER && 
  process.env.EMAIL_PASSWORD
);

// Helper function to get logo attachment for email
function getLogoAttachment() {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    if (fs.existsSync(logoPath)) {
      return {
        filename: 'logo.png',
        path: logoPath,
        cid: 'outfyld-logo' // same cid as in the html img src
      };
    }
  } catch (error) {
    console.warn('⚠️ Could not load logo for email attachment:', error);
  }
  return null;
}

// Helper function to format start date as "Month Week" format (e.g., "December first week")
function formatStartDateAsWeek(date: Date): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  
  let week = '';
  if (day <= 7) {
    week = 'first week';
  } else if (day <= 14) {
    week = 'second week';
  } else if (day <= 21) {
    week = 'third week';
  } else {
    week = 'fourth week';
  }
  
  return `${month} ${week}`;
}

/**
 * Send application confirmation email to applicant
 */
export async function sendApplicationConfirmationEmail(
  applicantEmail: string,
  applicantName: string,
  jobTitle: string,
  applicationId: string
): Promise<void> {
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true' || !isEmailConfigured) {
    console.log('📧 Email notifications disabled or not configured');
    return;
  }

  try {
    const senderName = process.env.EMAIL_SENDER_NAME || 'OutFyld Careers';
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'admin@outfyld.in';
    const logoAttachment = getLogoAttachment();

    const mailOptions = {
      from: `"${senderName}" <${fromEmail}>`,
      to: applicantEmail,
      subject: `Application Received - ${jobTitle} at OutFyld`,
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
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #ffffff;
              padding: 30px;
              text-align: center;
              border-bottom: 2px solid #e5e7eb;
            }
            .logo {
              max-width: 150px;
              height: auto;
              margin-bottom: 10px;
            }
            .header h1 {
              margin: 10px 0 0 0;
              font-size: 24px;
              color: #16a34a;
            }
            .content {
              padding: 30px;
            }
            .info-box {
              background-color: #f0fdf4;
              border-left: 4px solid #16a34a;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              background-color: #f9fafb;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #3b82f6;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="cid:outfyld-logo" alt="OutFyld Logo" class="logo" />
              <h1>Application Received</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>${applicantName}</strong>,</p>
              
              <p>Thank you for applying to the <strong>${jobTitle}</strong> position at OutFyld!</p>
              
              <div class="info-box">
                <p style="margin: 0;"><strong>What happens next?</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Our team will review your application</li>
                  <li>We'll reach out if your profile matches our requirements</li>
                  <li>You'll hear from us within 5-7 business days</li>
                </ul>
              </div>
              
              <p><strong>Application ID:</strong> ${applicationId}</p>
              
              <p>In the meantime, feel free to explore more about OutFyld and our mission to revolutionize sports booking in India.</p>
              
              <div style="text-align: center;">
                <a href="https://outfyld.in/careers" class="button">View All Openings</a>
              </div>
              
              <p style="margin-top: 30px;">Best regards,<br>
              <strong>The OutFyld Team</strong></p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from OutFyld Careers</p>
              <p>© ${new Date().getFullYear()} OutFyld. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: logoAttachment ? [logoAttachment] : []
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Application confirmation email sent to ${applicantEmail}`);
  } catch (error) {
    console.error('❌ Error sending application confirmation email:', error);
    throw error;
  }
}

/**
 * Send new application notification to admin
 */
export async function sendNewApplicationNotificationToAdmin(
  jobTitle: string,
  applicantName: string,
  applicantEmail: string,
  applicationId: string
): Promise<void> {
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true' || !isEmailConfigured) {
    console.log('📧 Email notifications disabled or not configured');
    return;
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const senderName = process.env.EMAIL_SENDER_NAME || 'OutFyld Careers';
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'admin@outfyld.in';

    const mailOptions = {
      from: `"${senderName}" <${fromEmail}>`,
      to: adminEmail,
      subject: `🔔 New Application: ${jobTitle} - ${applicantName}`,
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
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .detail-box {
              background-color: #f0f9ff;
              border: 1px solid #bfdbfe;
              border-radius: 5px;
              padding: 15px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: bold;
              width: 150px;
              color: #374151;
            }
            .detail-value {
              color: #1f2937;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              background-color: #f9fafb;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Job Application</h1>
            </div>
            
            <div class="content">
              <p>A new application has been submitted for the <strong>${jobTitle}</strong> position.</p>
              
              <div class="detail-box">
                <div class="detail-row">
                  <div class="detail-label">Applicant:</div>
                  <div class="detail-value">${applicantName}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Email:</div>
                  <div class="detail-value">${applicantEmail}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Position:</div>
                  <div class="detail-value">${jobTitle}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Application ID:</div>
                  <div class="detail-value">${applicationId}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Submitted:</div>
                  <div class="detail-value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="https://outfyld.in/admin/careers/applications" class="button">Review Application</a>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                Log in to your admin dashboard to view the full application details and resume.
              </p>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from OutFyld Careers System</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Admin notification email sent for application ${applicationId}`);
  } catch (error) {
    console.error('❌ Error sending admin notification email:', error);
    throw error;
  }
}

/**
 * Send application status update email to applicant
 */
export async function sendApplicationStatusUpdateEmail(
  applicantEmail: string,
  applicantName: string,
  jobTitle: string,
  status: string,
  adminNotes?: string
): Promise<void> {
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true' || !isEmailConfigured) {
    console.log('📧 Email notifications disabled or not configured');
    return;
  }

  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    under_review: {
      title: 'Application Under Review',
      message: 'Your application is currently being reviewed by our team.',
      color: '#2563eb',
    },
    shortlisted: {
      title: 'Congratulations! You\'ve been Shortlisted',
      message: 'We\'re impressed with your profile and would like to move forward.',
      color: '#16a34a',
    },
    rejected: {
      title: 'Application Status Update',
      message: 'Thank you for your interest. We\'ve decided to move forward with other candidates.',
      color: '#dc2626',
    },
    hired: {
      title: '🎉 Welcome to OutFyld!',
      message: 'Congratulations! We\'re excited to have you join our team.',
      color: '#16a34a',
    },
  };

  const statusInfo = statusMessages[status] || statusMessages.under_review;

  try {
    const senderName = process.env.EMAIL_SENDER_NAME || 'OutFyld Careers';
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'admin@outfyld.in';

    const mailOptions = {
      from: `"${senderName}" <${fromEmail}>`,
      to: applicantEmail,
      subject: `${statusInfo.title} - ${jobTitle}`,
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
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: ${statusInfo.color};
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .status-box {
              background-color: #f0f9ff;
              border-left: 4px solid ${statusInfo.color};
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              background-color: #f9fafb;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusInfo.title}</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>${applicantName}</strong>,</p>
              
              <p>We have an update regarding your application for the <strong>${jobTitle}</strong> position.</p>
              
              <div class="status-box">
                <p><strong>Status:</strong> ${statusInfo.message}</p>
                ${adminNotes ? `<p><strong>Additional Notes:</strong><br>${adminNotes}</p>` : ''}
              </div>
              
              ${status === 'shortlisted' ? `
                <p>Our team will be reaching out to you shortly to schedule the next steps.</p>
              ` : ''}
              
              ${status === 'rejected' ? `
                <p>While we won't be moving forward at this time, we encourage you to apply for other positions that match your skills and experience.</p>
              ` : ''}
              
              <p>Best regards,<br>
              <strong>The OutFyld Team</strong></p>
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
    console.log(`✅ Status update email sent to ${applicantEmail}`);
  } catch (error) {
    console.error('❌ Error sending status update email:', error);
    throw error;
  }
}

/**
 * Send shortlisted email to applicant (like offer letter format)
 */
export async function sendShortlistedEmail(
  applicantEmail: string,
  applicantName: string,
  jobTitle: string,
  jobDepartment: string,
  jobLocation: string,
  stipendAmount: string,
  stipendType: string,
  applicationId: string,
  offerLetterId: string
): Promise<void> {
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true' || !isEmailConfigured) {
    console.log('📧 Email notifications disabled or not configured');
    return;
  }

  try {
    const senderName = process.env.EMAIL_SENDER_NAME || 'OutFyld Careers';
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'admin@outfyld.in';
    const logoAttachment = getLogoAttachment();

    const mailOptions = {
      from: `"${senderName}" <${fromEmail}>`,
      to: applicantEmail,
      subject: `🎉 Congratulations! You're Shortlisted - ${jobTitle} at OutFyld`,
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
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #ffffff;
              padding: 40px 30px 30px 30px;
              text-align: center;
              border-bottom: 2px solid #e5e7eb;
            }
            .logo {
              max-width: 180px;
              height: auto;
              margin-bottom: 15px;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              color: #16a34a;
              font-weight: bold;
            }
            .header .company-name {
              font-size: 24px;
              color: #16a34a;
              font-weight: bold;
              margin: 10px 0 15px 0;
              letter-spacing: 1px;
            }
            .content {
              padding: 30px;
            }
            .info-box {
              background-color: #f0fdf4;
              border-left: 4px solid #16a34a;
              padding: 20px;
              margin: 20px 0;
            }
            .info-box h3 {
              margin-top: 0;
              color: #16a34a;
            }
            .detail-item {
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-item:last-child {
              border-bottom: none;
            }
            .detail-item strong {
              display: inline-block;
              width: 120px;
              color: #374151;
            }
            .footer {
              background-color: #f9fafb;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
            .note {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="cid:outfyld-logo" alt="OutFyld Logo" class="logo" />
              <div class="company-name">OUTFYLD</div>
              <h1>Congratulations! 🎉</h1>
            </div>
            
            <div class="content">
              <p>Dear <strong>${applicantName}</strong>,</p>
              
              <p>🎉 <strong>Congratulations!</strong> We are pleased to inform you that you have been <strong>shortlisted</strong> for the position of <strong>${jobTitle}</strong> at OutFyld.</p>
              
              <p>After reviewing your qualifications, we are confident that you will be a valuable addition to our team.</p>
              
              <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af; font-weight: 600;">🎯 Your Offer Letter ID</p>
                <p style="margin: 5px 0 0 0; color: #1e40af; font-size: 18px;"><strong>${offerLetterId}</strong></p>
                <p style="margin: 5px 0 0 0; color: #1e40af; font-size: 12px;">You will need this ID in the acceptance process</p>
              </div>
              
              <div class="info-box">
                <h3>Position Details:</h3>
                <div class="detail-item">
                  <strong>Offer Letter ID:</strong> ${offerLetterId}
                </div>
                <div class="detail-item">
                  <strong>Position:</strong> ${jobTitle}
                </div>
                <div class="detail-item">
                  <strong>Department:</strong> ${jobDepartment}
                </div>
                <div class="detail-item">
                  <strong>Location:</strong> ${jobLocation}
                </div>
                <div class="detail-item">
                  <strong>Stipend:</strong> ${stipendAmount} (${stipendType})
                </div>
              </div>
              
              <div class="note">
                <p style="margin: 0;"><strong>📋 Next Steps:</strong></p>
                <p style="margin: 10px 0;">Click the button below to accept this offer and complete the onboarding process.</p>
              </div>
              
              <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #991b1b; font-weight: 600;">⏰ Important: This offer expires in 7 days</p>
                <p style="margin: 5px 0 0 0; color: #991b1b;">Please complete the acceptance process before the deadline.</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_APP_URL || 'https://outfyld.in')}/careers/accept-offer/${applicationId}" 
                   class="button" 
                   style="background-color: #16a34a; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                  ✓ Start Acceptance Process
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; text-align: center;">
                By accepting this offer, you confirm your intent to join OutFyld for the ${jobTitle} position.
              </p>
              
              <p><strong>Application ID:</strong> ${applicationId}</p>
              
              <p style="margin-top: 30px;">We look forward to having you on our team!</p>
              
              <p>Warm regards,<br>
              <strong>HR Manager</strong><br>
              OutFyld<br>
              <a href="mailto:admin@outfyld.in" style="color: #16a34a;">admin@outfyld.in</a><br>
              <a href="https://www.outfyld.in" style="color: #16a34a;">www.outfyld.in</a></p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from OutFyld Careers</p>
              <p>© ${new Date().getFullYear()} OutFyld. All rights reserved.</p>
              <p>© Copyright & Trademark Registered in India OutFyld | All Rights Reserved</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: logoAttachment ? [logoAttachment] : []
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Shortlisted email sent to ${applicantEmail}`);
  } catch (error) {
    console.error('❌ Error sending shortlisted email:', error);
    throw error;
  }
}

/**
 * Send rejection email to applicant
 */
export async function sendRejectionEmail(
  applicantEmail: string,
  applicantName: string,
  jobTitle: string,
  applicationId: string
): Promise<void> {
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true' || !isEmailConfigured) {
    console.log('📧 Email notifications disabled or not configured');
    return;
  }

  try {
    const senderName = process.env.EMAIL_SENDER_NAME || 'OutFyld Careers';
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'admin@outfyld.in';

    const mailOptions = {
      from: `"${senderName}" <${fromEmail}>`,
      to: applicantEmail,
      subject: `Application Update - ${jobTitle} at OutFyld`,
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
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
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
            .info-box {
              background-color: #f0f9ff;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #16a34a;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              background-color: #f9fafb;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Status Update</h1>
            </div>
            
            <div class="content">
              <p>Dear <strong>${applicantName}</strong>,</p>
              
              <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at OutFyld and for taking the time to apply.</p>
              
              <p>After careful consideration of all applications, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match our current requirements.</p>
              
              <div class="info-box">
                <p style="margin: 0;"><strong>This decision does not reflect on your abilities or potential.</strong></p>
                <p style="margin: 10px 0 0 0;">We received many qualified applications, and the selection process was highly competitive.</p>
              </div>
              
              <p>We encourage you to:</p>
              <ul>
                <li>Continue exploring other opportunities at OutFyld</li>
                <li>Check our careers page regularly for new openings</li>
                <li>Apply for positions that align with your skills and experience</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="https://www.outfyld.in/careers/jobs" class="button">View Other Openings</a>
              </div>
              
              <p><strong>Application ID:</strong> ${applicationId}</p>
              
              <p style="margin-top: 30px;">We wish you the very best in your career journey and future endeavors.</p>
              
              <p>Best regards,<br>
              <strong>The OutFyld Team</strong><br>
              <a href="mailto:admin@outfyld.in" style="color: #16a34a;">admin@outfyld.in</a></p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from OutFyld Careers</p>
              <p>© ${new Date().getFullYear()} OutFyld. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Rejection email sent to ${applicantEmail}`);
  } catch (error) {
    console.error('❌ Error sending rejection email:', error);
    throw error;
  }
}

/**
 * Send joining letter email after successful payment
 */
export async function sendJoiningLetterEmail(
  applicantEmail: string,
  applicantName: string,
  position: string,
  startDate: Date,
  joiningLetterUrl: string,
  offerLetterId: string,
  receiptUrl?: string,
  joiningLetterBuffer?: Buffer,
  receiptBuffer?: Buffer
): Promise<void> {
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true' || !isEmailConfigured) {
    console.log('📧 Email notifications disabled or not configured');
    return;
  }

  try {
    const senderName = process.env.EMAIL_SENDER_NAME || 'OutFyld HR Team';
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'admin@outfyld.in';
    const logoAttachment = getLogoAttachment();

    const formattedStartDate = formatStartDateAsWeek(new Date(startDate));

    const mailOptions = {
      from: `"${senderName}" <${fromEmail}>`,
      to: applicantEmail,
      subject: `🎉 Welcome to OutFyld - Joining Letter for ${position}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f9fafb;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #16a34a;
            }
            .logo {
              max-width: 180px;
              height: auto;
              margin-bottom: 10px;
            }
            .tagline {
              font-size: 14px;
              color: #6b7280;
              margin-top: 5px;
            }
            .info-box {
              background-color: #dbeafe;
              border-left: 4px solid #2563eb;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .details-table {
              width: 100%;
              margin: 20px 0;
              border-collapse: collapse;
            }
            .details-table th {
              text-align: left;
              padding: 12px;
              background-color: #f3f4f6;
              font-weight: 600;
              color: #374151;
            }
            .details-table td {
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="cid:outfyld-logo" alt="OutFyld Logo" class="logo" />
              <p class="tagline">Grow Faster. Learn Smarter</p>
            </div>
            
            <h1 style="color: #16a34a; text-align: center;">Welcome to OutFyld!</h1>
            
            <p>Dear <strong>${applicantName}</strong>,</p>
            
            <p>Congratulations! 🎊 Your payment has been successfully processed, and we are thrilled to officially welcome you to the OutFyld team.</p>
            
            <div class="info-box">
              <p style="margin: 0;"><strong>📄 Your Documents are Attached!</strong></p>
              <p style="margin: 5px 0 0 0;">Your official joining letter and payment receipt have been attached to this email for your records.</p>
            </div>
            
            <table class="details-table">
              <tr>
                <th>Offer Letter ID</th>
                <td><strong>${offerLetterId}</strong></td>
              </tr>
              <tr>
                <th>Position</th>
                <td>${position}</td>
              </tr>
              <tr>
                <th>Start Date</th>
                <td>${formattedStartDate}</td>
              </tr>
              <tr>
                <th>Payment Status</th>
                <td style="color: #16a34a; font-weight: 600;">✓ Completed (₹249)</td>
              </tr>
            </table>
            
            <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 15px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; font-weight: 600; color: #166534;">📋 Next Steps:</p>
              <ol style="margin: 10px 0; padding-left: 20px; color: #166534;">
                <li>Download and save your joining letter and payment receipt from the attachments</li>
                <li>Mark your calendar for ${formattedStartDate}</li>
                <li>Watch for an email with onboarding instructions</li>
                <li>Prepare any required documents</li>
              </ol>
            </div>
            
            <p style="margin-top: 30px;">If you have any questions, please don't hesitate to reach out to our HR team.</p>
            
            <p>We're excited to have you on board!</p>
            
            <p>Warm regards,<br>
            <strong>HR Team</strong><br>
            OutFyld<br>
            <a href="mailto:admin@outfyld.in">admin@outfyld.in</a></p>
            
            <div class="footer">
              <p>This is an automated email. Please do not reply directly to this message.</p>
              <p>© ${new Date().getFullYear()} OutFyld. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        ...(logoAttachment ? [logoAttachment] : []),
        ...(joiningLetterBuffer ? [{
          filename: `Joining-Letter-${offerLetterId}.pdf`,
          content: joiningLetterBuffer,
          contentType: 'application/pdf'
        }] : []),
        ...(receiptBuffer ? [{
          filename: `Payment-Receipt-${offerLetterId}.pdf`,
          content: receiptBuffer,
          contentType: 'application/pdf'
        }] : [])
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Joining letter email sent to ${applicantEmail}`);
  } catch (error) {
    console.error('❌ Error sending joining letter email:', error);
    throw error;
  }
}
