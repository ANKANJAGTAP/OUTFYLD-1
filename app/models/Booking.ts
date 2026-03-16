import mongoose, { Document, Schema } from 'mongoose';

// Interface for Booking document
interface IBooking extends Document {
  customerId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  turfId: mongoose.Types.ObjectId;
  slot: {
    day: string;
    startTime: string;
    endTime: string;
    date: string; // YYYY-MM-DD format
  };
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'refunded' | 'partially_refunded';
  totalAmount: number;
  
  // Razorpay payment fields
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partially_refunded';
  
  // Payment split details
  platformCommission?: number;
  ownerShare?: number;
  gatewayFee?: number;
  razorpayTransferId?: string;
  
  // Cancellation & Refund fields
  cancelledBy?: 'player' | 'owner';
  cancelledAt?: Date;
  cancellationReason?: string;
  refundAmount?: number;
  refundId?: string;
  refundStatus?: 'pending' | 'processed' | 'failed';
  refundProcessedAt?: Date;

  // Loyalty attributes
  appliedLoyaltyPoints?: number;
  loyaltyDiscountAmount?: number;
  loyaltyPointsEarned?: number;

  // Dynamic pricing / promo attributes
  dynamicDiscountPercent?: number;
  dynamicDiscountAmount?: number;
  promoCode?: string;
  promoDiscountAmount?: number;
  
  // Legacy field — kept for backward compatibility with old bookings
  paymentScreenshot?: {
    url: string;
    public_id: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Subdocument schema for time slot
const BookingSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format validation
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format validation
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/ // YYYY-MM-DD format validation
  }
}, { _id: false });

// Legacy subdocument schema for Cloudinary payment screenshot
const PaymentScreenshotSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  public_id: {
    type: String,
    required: true
  }
}, { _id: false });

const BookingSchema = new mongoose.Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  turfId: {
    type: Schema.Types.ObjectId,
    ref: 'Turf',
    required: true
  },
  slot: {
    type: BookingSlotSchema,
    required: true
  },
  status: {
    type: String,
    enum: ['pending_payment', 'pending', 'confirmed', 'rejected', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'pending_payment',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Razorpay payment fields
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  
  // Payment split details
  platformCommission: { type: Number, min: 0 },
  ownerShare: { type: Number, min: 0 },
  gatewayFee: { type: Number, min: 0 },
  razorpayTransferId: String,
  
  // Cancellation & Refund fields
  cancelledBy: {
    type: String,
    enum: ['player', 'owner']
  },
  cancelledAt: Date,
  cancellationReason: String,
  refundAmount: { type: Number, min: 0 },
  refundId: String,
  refundStatus: {
    type: String,
    enum: ['pending', 'processed', 'failed']
  },
  refundProcessedAt: Date,

  // Loyalty attributes
  appliedLoyaltyPoints: { type: Number, min: 0, default: 0 },
  loyaltyDiscountAmount: { type: Number, min: 0, default: 0 },
  loyaltyPointsEarned: { type: Number, min: 0, default: 0 },

  // Dynamic pricing / promo attributes
  dynamicDiscountPercent: { type: Number, min: 0, default: 0 },
  dynamicDiscountAmount: { type: Number, min: 0, default: 0 },
  promoCode: { type: String },
  promoDiscountAmount: { type: Number, min: 0, default: 0 },
  
  // Legacy field — kept for backward compatibility with old bookings
  paymentScreenshot: {
    type: PaymentScreenshotSchema,
    required: false
  }
}, {
  timestamps: true
});

// ─── Indexes ─────────────────────────────────────────────────────────

// Single-field indexes for general queries
BookingSchema.index({ customerId: 1 });
BookingSchema.index({ ownerId: 1 });
BookingSchema.index({ turfId: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ 'slot.day': 1, 'slot.startTime': 1, 'slot.date': 1 });
BookingSchema.index({ razorpayOrderId: 1 });

// ✅ NEW: Compound index for dynamic pricing aggregation queries
// The pricing engine matches on { turfId, slot.date, status } together.
// Without this, MongoDB uses the single turfId index and scans ALL bookings
// for that turf across all dates, then filters in memory.
// With this, it does a direct lookup: exact turfId + exact dates + confirmed status.
BookingSchema.index(
  { turfId: 1, 'slot.date': 1, status: 1 },
  { name: 'idx_dynamic_pricing_lookup' }
);

// Pre-save middleware to validate booking data
BookingSchema.pre('save', function(this: IBooking, next) {
  // Validate that start time is before end time
  const startTime = this.slot.startTime.split(':').map(Number);
  const endTime = this.slot.endTime.split(':').map(Number);
  const startMinutes = startTime[0] * 60 + startTime[1];
  const endMinutes = endTime[0] * 60 + endTime[1];
  
  if (startMinutes >= endMinutes) {
    return next(new Error('End time must be after start time'));
  }
  
  next();
});

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);