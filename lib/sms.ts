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
  console.log('📱 TWILIO INIT: Checking Twilio client...');
  
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.warn('⚠️ TWILIO INIT: TWILIO_ACCOUNT_SID not found in environment');
    return null;
  }
  
  if (!process.env.TWILIO_AUTH_TOKEN) {
    console.warn('⚠️ TWILIO INIT: TWILIO_AUTH_TOKEN not found in environment');
    return null;
  }
  
  if (!twilioClient) {
    try {
      console.log('📱 TWILIO INIT: Initializing Twilio client...');
      console.log('📱 TWILIO INIT: Account SID:', process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...');
      
      const twilio = require('twilio');
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      console.log('✅ TWILIO INIT: Twilio client initialized successfully');
    } catch (error: any) {
      console.error('❌ TWILIO INIT: Failed to initialize Twilio client');
      console.error('❌ TWILIO INIT: Error:', error?.message);
      return null;
    }
  } else {
    console.log('✅ TWILIO INIT: Using existing Twilio client');
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
    console.log('📱 SMS SERVICE: Starting to send booking notification SMS');
    console.log('📱 SMS SERVICE: Owner phone:', ownerPhone);
    console.log('📱 SMS SERVICE: Owner name:', ownerName);
    console.log('📱 SMS SERVICE: Booking ID:', bookingDetails.bookingId);
    
    const client = getTwilioClient();
    
    if (!client) {
      console.warn('⚠️ SMS SERVICE: Twilio client not configured. Skipping SMS notification.');
      console.warn('⚠️ SMS SERVICE: Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables');
      return;
    }
    
    console.log('✅ SMS SERVICE: Twilio client initialized');

    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.warn('⚠️ SMS SERVICE: TWILIO_PHONE_NUMBER not configured. Skipping SMS notification.');
      return;
    }
    
    console.log('✅ SMS SERVICE: Twilio phone number configured:', process.env.TWILIO_PHONE_NUMBER);

    // Format phone number (ensure it has country code)
    const formattedPhone = formatPhoneNumber(ownerPhone);
    console.log('📱 SMS SERVICE: Formatted phone:', formattedPhone);

    if (!formattedPhone) {
      console.warn('⚠️ SMS SERVICE: Invalid phone number format. Original:', ownerPhone);
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

    console.log('📱 SMS SERVICE: Sending message to owner...');
    console.log('📱 SMS SERVICE: From:', process.env.TWILIO_PHONE_NUMBER);
    console.log('📱 SMS SERVICE: To:', formattedPhone);
    console.log('📱 SMS SERVICE: Message length:', message.length);

    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log('✅ SMS SERVICE: Booking notification SMS sent successfully!');
    console.log('✅ SMS SERVICE: Message SID:', response.sid);
    console.log('✅ SMS SERVICE: Status:', response.status);
  } catch (error: any) {
    console.error('❌ SMS SERVICE: Error sending booking notification SMS');
    console.error('❌ SMS SERVICE: Error type:', error?.constructor?.name);
    console.error('❌ SMS SERVICE: Error message:', error?.message);
    console.error('❌ SMS SERVICE: Error code:', error?.code);
    console.error('❌ SMS SERVICE: Error details:', JSON.stringify(error, null, 2));
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
    console.log(`📱 SMS SERVICE: Starting to send ${status} SMS to customer`);
    console.log('📱 SMS SERVICE: Customer phone:', customerPhone);
    console.log('📱 SMS SERVICE: Customer name:', customerName);
    console.log('📱 SMS SERVICE: Turf name:', turfName);
    
    const client = getTwilioClient();
    
    if (!client) {
      console.warn('⚠️ SMS SERVICE: Twilio client not configured. Skipping SMS notification.');
      console.warn('⚠️ SMS SERVICE: Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables');
      return;
    }
    
    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.warn('⚠️ SMS SERVICE: TWILIO_PHONE_NUMBER not configured. Skipping SMS notification.');
      return;
    }
    
    console.log('✅ SMS SERVICE: Twilio configured');

    const formattedPhone = formatPhoneNumber(customerPhone);
    console.log('📱 SMS SERVICE: Formatted phone:', formattedPhone);

    if (!formattedPhone) {
      console.warn('⚠️ SMS SERVICE: Invalid phone number format. Original:', customerPhone);
      return;
    }

    const message = status === 'confirmed'
      ? `✅ Great news ${customerName}! Your booking for ${turfName} has been CONFIRMED. See you on the turf! - OutFyld`
      : `❌ Hi ${customerName}, your booking for ${turfName} has been rejected. Refund will be processed in 5-7 days. - OutFyld`;

    console.log('📱 SMS SERVICE: Sending status SMS...');
    console.log('📱 SMS SERVICE: From:', process.env.TWILIO_PHONE_NUMBER);
    console.log('📱 SMS SERVICE: To:', formattedPhone);
    console.log('📱 SMS SERVICE: Status:', status);

    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log(`✅ SMS SERVICE: ${status} SMS sent successfully!`);
    console.log('✅ SMS SERVICE: Message SID:', response.sid);
    console.log('✅ SMS SERVICE: Status:', response.status);
  } catch (error: any) {
    console.error(`❌ SMS SERVICE: Error sending ${status} SMS to customer`);
    console.error('❌ SMS SERVICE: Error type:', error?.constructor?.name);
    console.error('❌ SMS SERVICE: Error message:', error?.message);
    console.error('❌ SMS SERVICE: Error code:', error?.code);
    console.error('❌ SMS SERVICE: Error details:', JSON.stringify(error, null, 2));
  }
}

/**
 * Format phone number to E.164 format (required by Twilio)
 * Example: +919876543210
 */
function formatPhoneNumber(phone: string): string | null {
  console.log('📱 FORMAT PHONE: Input:', phone);
  
  if (!phone) {
    console.warn('⚠️ FORMAT PHONE: Phone is empty or undefined');
    return null;
  }

  // Remove all non-digit characters
  let cleanPhone = phone.replace(/\D/g, '');
  console.log('📱 FORMAT PHONE: Clean phone (digits only):', cleanPhone);

  // If it starts with country code, keep it
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    const formatted = '+' + cleanPhone;
    console.log('✅ FORMAT PHONE: Formatted with existing country code:', formatted);
    return formatted;
  }

  // If it's 10 digits, assume Indian number and add +91
  if (cleanPhone.length === 10) {
    const formatted = '+91' + cleanPhone;
    console.log('✅ FORMAT PHONE: Added +91 to 10-digit number:', formatted);
    return formatted;
  }

  // If it already has +, return as is
  if (phone.startsWith('+')) {
    console.log('✅ FORMAT PHONE: Already has + prefix, using as-is:', phone);
    return phone;
  }

  // Unable to format
  console.warn('⚠️ FORMAT PHONE: Unable to format phone number:', phone);
  console.warn('⚠️ FORMAT PHONE: Clean phone length:', cleanPhone.length);
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
