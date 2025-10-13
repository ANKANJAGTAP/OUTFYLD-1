// SMS notification service using Twilio
// Note: Twilio is a paid service. You'll need to set up an account at https://www.twilio.com

interface SMSConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

interface BookingSMSDetails {
  customerName: string;
  turfName: string;
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  bookingId: string;
}

// Initialize Twilio client (lazy loading)
let twilioClient: any = null;

function getTwilioClient() {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = require('twilio');
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      console.log('Twilio client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Twilio client:', error);
    }
  }
  return twilioClient;
}

/**
 * Send SMS notification to turf owner about new booking
 */
export async function sendBookingNotificationSMS(
  ownerPhone: string,
  ownerName: string,
  bookingDetails: BookingSMSDetails
): Promise<void> {
  try {
    const client = getTwilioClient();
    
    if (!client) {
      console.warn('Twilio client not configured. Skipping SMS notification.');
      return;
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.warn('TWILIO_PHONE_NUMBER not configured. Skipping SMS notification.');
      return;
    }

    // Format phone number (ensure it has country code)
    const formattedPhone = formatPhoneNumber(ownerPhone);

    if (!formattedPhone) {
      console.warn('Invalid phone number format. Skipping SMS notification.');
      return;
    }

    const { customerName, turfName, bookingDate, bookingTime, totalAmount, bookingId } = bookingDetails;

    const message = `
🔔 New Booking Alert!

Hello ${ownerName},

You have a new booking request:

Customer: ${customerName}
Turf: ${turfName}
Date: ${bookingDate}
Time: ${bookingTime}
Amount: ₹${totalAmount}

Booking ID: ${bookingId}

Please log in to your OutFyld dashboard to review and approve this booking.

- OutFyld Team
    `.trim();

    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log('SMS sent successfully:', response.sid);
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    // Don't throw error to prevent booking creation from failing if SMS fails
    // SMS is a nice-to-have, not critical
  }
}

/**
 * Send SMS notification to customer about booking status
 */
export async function sendBookingStatusSMS(
  customerPhone: string,
  customerName: string,
  turfName: string,
  status: 'confirmed' | 'rejected'
): Promise<void> {
  try {
    const client = getTwilioClient();
    
    if (!client || !process.env.TWILIO_PHONE_NUMBER) {
      console.warn('Twilio not configured. Skipping SMS notification.');
      return;
    }

    const formattedPhone = formatPhoneNumber(customerPhone);

    if (!formattedPhone) {
      console.warn('Invalid phone number format. Skipping SMS notification.');
      return;
    }

    const message = status === 'confirmed'
      ? `✅ Great news ${customerName}! Your booking for ${turfName} has been CONFIRMED. See you on the turf! - OutFyld`
      : `❌ Hi ${customerName}, your booking for ${turfName} has been rejected. Refund will be processed in 5-7 days. - OutFyld`;

    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log('Status SMS sent successfully:', response.sid);
  } catch (error) {
    console.error('Error sending status SMS:', error);
  }
}

/**
 * Format phone number to E.164 format (required by Twilio)
 * Example: +919876543210
 */
function formatPhoneNumber(phone: string): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  let cleanPhone = phone.replace(/\D/g, '');

  // If it starts with country code, keep it
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    return '+' + cleanPhone;
  }

  // If it's 10 digits, assume Indian number and add +91
  if (cleanPhone.length === 10) {
    return '+91' + cleanPhone;
  }

  // If it already has +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }

  // Unable to format
  console.warn('Unable to format phone number:', phone);
  return null;
}

/**
 * Alternative SMS provider configuration for services like:
 * - MSG91 (Popular in India)
 * - Fast2SMS
 * - TextLocal
 * 
 * Uncomment and modify based on your chosen provider
 */

/*
// Example: MSG91 SMS Service
export async function sendSMSViaMSG91(
  phone: string,
  message: string
): Promise<void> {
  try {
    const response = await fetch('https://api.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': process.env.MSG91_AUTH_KEY || '',
      },
      body: JSON.stringify({
        sender: process.env.MSG91_SENDER_ID,
        mobile: phone,
        message: message,
      }),
    });

    const data = await response.json();
    console.log('MSG91 SMS sent:', data);
  } catch (error) {
    console.error('Error sending SMS via MSG91:', error);
  }
}
*/

const smsService = {
  sendBookingNotificationSMS,
  sendBookingStatusSMS,
};

export default smsService;
