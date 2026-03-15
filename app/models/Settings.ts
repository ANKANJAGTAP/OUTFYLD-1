import mongoose, { Document } from 'mongoose';

// Subdocument schema for Cloudinary images (legacy)
const CloudinaryImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  public_id: {
    type: String,
    required: true
  }
}, { _id: false });

// Subdocument for a subscription plan
const SubscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  durationMonths: { type: Number, required: true },
  maxTurfs: { type: Number, required: true, min: 1 },
  features: [{ type: String }]
}, { _id: false });

// Interface for Settings document
interface ISettings extends Document {
  // Legacy field
  adminPaymentQR?: {
    url: string;
    public_id: string;
  };
  
  // Subscription plan configuration
  subscriptionPlans?: {
    starter: {
      name: string;
      price: number;
      durationMonths: number;
      maxTurfs: number;
      features: string[];
    };
    pro: {
      name: string;
      price: number;
      durationMonths: number;
      maxTurfs: number;
      features: string[];
    };
  };
  
  // Platform commission percentage for booking payments
  platformCommissionPercent?: number;
  
  // Cancellation policy
  cancellationPolicy?: {
    fullRefundHours: number;    // Hours before slot for full refund (default: 24)
    partialRefundHours: number; // Hours before slot for partial refund (default: 4)
    partialRefundPercent: number; // Partial refund percentage (default: 50)
  };
  
  updatedBy?: string;
  updatedAt?: Date;
}

const SettingsSchema = new mongoose.Schema({
  // Legacy field — kept for backward compatibility
  adminPaymentQR: {
    type: CloudinaryImageSchema,
    required: false
  },
  
  // Subscription plan configuration
  subscriptionPlans: {
    starter: {
      type: SubscriptionPlanSchema,
      default: {
        name: 'Starter Plan',
        price: 1500,
        durationMonths: 6,
        maxTurfs: 1,
        features: [
          'List 1 sports facility / turf',
          'Manage booking calendar',
          'Accept online bookings from users',
          'Manual booking entry (walk-in customers)',
          'Basic analytics (Daily bookings, Monthly revenue)',
          'Basic customer management',
          'Email / WhatsApp booking notifications',
          'Standard listing visibility in search',
          'Support via email'
        ]
      }
    },
    pro: {
      type: SubscriptionPlanSchema,
      default: {
        name: 'Pro Plan',
        price: 2000,
        durationMonths: 12,
        maxTurfs: 3,
        features: [
          'Everything in Starter Plan',
          'List up to 3 sports fields / turfs',
          'Priority listing in search results',
          'Advanced analytics dashboard (Peak hours, Revenue trends, Booking heatmap)',
          'Dynamic pricing tools (Weekend multiplier, Happy hour pricing)',
          'Coupon & discount system',
          'Automated booking confirmations',
          'Customer history & repeat user insights',
          'Marketing tools (Featured listing, Promotional banners)',
          'Priority support'
        ]
      }
    }
  },
  
  // Platform commission percentage
  platformCommissionPercent: {
    type: Number,
    default: 8,
    min: 0,
    max: 100
  },
  
  // Cancellation policy
  cancellationPolicy: {
    fullRefundHours: { type: Number, default: 24 },
    partialRefundHours: { type: Number, default: 4 },
    partialRefundPercent: { type: Number, default: 50 }
  },
  
  updatedBy: String,
  updatedAt: Date
}, {
  timestamps: true
});

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
