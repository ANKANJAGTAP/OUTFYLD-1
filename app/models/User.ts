import mongoose, { Document } from 'mongoose';

// Subdocument schema for Cloudinary images
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

// Subdocument schema for time slots
const TimeSlotSchema = new mongoose.Schema({
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
  }
}, { _id: false });

// Interface for User document
interface IUser extends Document {
  uid: string;
  name: string;
  email: string;
  role: 'customer' | 'owner' | 'admin';
  phone?: string;
  businessName?: string;
  emailVerified: boolean;
  isActive: boolean;
  
  // Subscription plan fields (for turf owners)
  subscriptionPlan?: 'starter' | 'pro';
  subscriptionAmount?: number;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  subscriptionStatus?: 'active' | 'expired' | 'none';
  razorpaySubscriptionOrderId?: string;
  razorpaySubscriptionPaymentId?: string;
  
  // Legacy field — kept for backward compatibility with old data
  paymentScreenshot?: {
    url: string;
    public_id: string;
  };
  
  // Bank details for Razorpay transfers (turf owners)
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountType: 'savings' | 'current';
    panNumber: string;
    gstNumber?: string;
  };
  razorpayContactId?: string;
  razorpayLinkedAccountId?: string; // Fund account ID for receiving transfers
  bankDetailsVerified?: boolean;
  
  // Admin verification fields (for turf owners)
  isVerifiedByAdmin?: boolean;
  paymentVerified?: boolean;
  paymentDetails?: {
    amount?: number;
    date?: Date;
    transactionId?: string;
    method?: string;
  };
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: Date;

  // Loyalty Program fields (for customers)
  loyaltyPoints: number;
  loyaltyHistory: Array<{
    amount: number;
    type: 'earned' | 'spent';
    description: string;
    date: Date;
  }>;
}

const UserSchema = new mongoose.Schema({
  uid: { 
    type: String, 
    required: true, 
    unique: true
  },
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true 
  },
  role: { 
    type: String, 
    enum: ['customer', 'owner', 'admin'], 
    required: true 
  },
  phone: String,
  businessName: String,
  emailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Subscription plan fields (for turf owners)
  subscriptionPlan: {
    type: String,
    enum: ['starter', 'pro', 'basic', 'premium'], // includes legacy values
  },
  subscriptionAmount: {
    type: Number,
    min: 0
  },
  subscriptionStartDate: {
    type: Date
  },
  subscriptionEndDate: {
    type: Date
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'expired', 'none'],
    default: 'none'
  },
  razorpaySubscriptionOrderId: String,
  razorpaySubscriptionPaymentId: String,
  
  // Legacy field — kept for backward compatibility
  paymentScreenshot: {
    type: CloudinaryImageSchema,
    required: false
  },
  
  // Bank details for Razorpay transfers
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountType: {
      type: String,
      enum: ['savings', 'current']
    },
    panNumber: String,
    gstNumber: String
  },
  razorpayContactId: String,
  razorpayLinkedAccountId: String,
  bankDetailsVerified: {
    type: Boolean,
    default: false
  },
  
  // Admin verification fields (for turf owners)
  isVerifiedByAdmin: {
    type: Boolean,
    default: function(this: IUser): boolean {
      return this.role !== 'owner';
    }
  },
  paymentVerified: {
    type: Boolean,
    default: false
  },
  paymentDetails: {
    amount: Number,
    date: Date,
    transactionId: String,
    method: String
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function(this: IUser): string {
      return this.role === 'owner' ? 'pending' : 'approved';
    }
  },
  rejectionReason: String,
  verifiedBy: String,
  verifiedAt: Date,

  // Loyalty Program fields (for customers)
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  loyaltyHistory: [{
    amount: { type: Number, required: true },
    type: { type: String, enum: ['earned', 'spent'], required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Create indexes for faster queries
UserSchema.index({ role: 1 });
UserSchema.index({ subscriptionStatus: 1, subscriptionEndDate: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
