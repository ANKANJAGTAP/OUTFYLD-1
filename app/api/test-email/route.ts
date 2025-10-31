import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Create test transporter with enhanced configuration
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      },
      debug: true, // Enable debug logs
      logger: true // Enable detailed logs
    });

    // Test connection
    await transporter.verify();

    // Send test email
    const testEmail = {
      from: `"OutFyld Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Production Email Test',
      html: `
        <h2>Email Test Successful!</h2>
        <p>This email was sent from production at: ${new Date().toISOString()}</p>
        <p>Environment: ${process.env.NODE_ENV}</p>
        <p>Host: ${process.env.EMAIL_HOST}</p>
        <p>Port: ${process.env.EMAIL_PORT}</p>
      `
    };

    const result = await transporter.sendMail(testEmail);

    return NextResponse.json({
      success: true,
      message: 'Email test successful',
      messageId: result.messageId,
      environment: {
        EMAIL_HOST: process.env.EMAIL_HOST,
        EMAIL_PORT: process.env.EMAIL_PORT,
        EMAIL_SECURE: process.env.EMAIL_SECURE,
        EMAIL_USER: process.env.EMAIL_USER ? '***@' + process.env.EMAIL_USER.split('@')[1] : 'Not set',
        NODE_ENV: process.env.NODE_ENV
      }
    });

  } catch (error: any) {
    console.error('Email test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      environment: {
        EMAIL_HOST: process.env.EMAIL_HOST,
        EMAIL_PORT: process.env.EMAIL_PORT,
        EMAIL_SECURE: process.env.EMAIL_SECURE,
        EMAIL_USER: process.env.EMAIL_USER ? '***@' + process.env.EMAIL_USER.split('@')[1] : 'Not set',
        NODE_ENV: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}