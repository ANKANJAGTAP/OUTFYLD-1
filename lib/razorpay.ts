import Razorpay from 'razorpay';
import crypto from 'crypto';

// Lazy initialization — Razorpay instance is created on first use
let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables'
      );
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
}

/**
 * Create a Razorpay order
 */
export async function createOrder(
  amount: number, // in INR (not paise)
  currency: string = 'INR',
  receipt: string,
  notes: Record<string, string> = {}
) {
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // convert to paise
    currency,
    receipt,
    notes,
  });
  return order;
}

/**
 * Verify Razorpay payment signature
 * Returns true if signature is valid
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

/**
 * Fetch payment details from Razorpay
 */
export async function fetchPayment(paymentId: string) {
  const razorpay = getRazorpay();
  return await razorpay.payments.fetch(paymentId);
}

/**
 * Initiate a transfer from a payment to a fund account (Razorpay Route / Transfer API)
 * Used for splitting booking payments between platform and turf owner
 */
export async function createTransfer(
  paymentId: string,
  transfers: Array<{
    account: string;
    amount: number; // in INR (not paise)
    currency?: string;
    notes?: Record<string, string>;
  }>
) {
  const razorpay = getRazorpay();
  const transferPayload = transfers.map((t) => ({
    account: t.account,
    amount: Math.round(t.amount * 100), // convert to paise
    currency: t.currency || 'INR',
    notes: t.notes || {},
  }));

  const result = await (razorpay.payments as any).transfer(paymentId, {
    transfers: transferPayload,
  });
  return result;
}

/**
 * Initiate a refund for a payment
 * @param paymentId - Razorpay payment ID
 * @param amount - Refund amount in INR (not paise). If omitted, full refund is issued.
 * @param notes - Optional notes for the refund
 */
export async function initiateRefund(
  paymentId: string,
  amount?: number,
  notes: Record<string, string> = {}
) {
  const razorpay = getRazorpay();
  const refundPayload: any = {
    notes,
  };

  if (amount !== undefined) {
    refundPayload.amount = Math.round(amount * 100); // convert to paise
  }

  const refund = await (razorpay.payments as any).refund(paymentId, refundPayload);
  return refund;
}

/**
 * Create a Razorpay Contact (needed for fund account / transfers)
 */
export async function createContact(contactDetails: {
  name: string;
  email: string;
  contact: string;
  type: string;
  notes?: Record<string, string>;
}) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const response = await fetch('https://api.razorpay.com/v1/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:
        'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
    },
    body: JSON.stringify(contactDetails),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create contact: ${JSON.stringify(error)}`);
  }
  return await response.json();
}

/**
 * Create a Razorpay Fund Account (bank account) linked to a Contact
 */
export async function createFundAccount(fundAccountDetails: {
  contact_id: string;
  account_type: 'bank_account';
  bank_account: {
    name: string;
    ifsc: string;
    account_number: string;
  };
}) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const response = await fetch('https://api.razorpay.com/v1/fund_accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:
        'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
    },
    body: JSON.stringify(fundAccountDetails),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create fund account: ${JSON.stringify(error)}`);
  }
  return await response.json();
}

/**
 * Fetch refund details
 */
export async function fetchRefund(paymentId: string, refundId: string) {
  const razorpay = getRazorpay();
  return await (razorpay.payments as any).fetchRefund(paymentId, refundId);
}

export default getRazorpay;
