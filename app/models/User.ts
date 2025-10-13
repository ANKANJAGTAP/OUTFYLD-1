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
  subscriptionPlan?: 'basic' | 'premium';
  subscriptionAmount?: number; // Monthly amount (1000 for basic, 2000 for premium)
  paymentScreenshot?: {
    url: string;
    public_id: string;
  };
  
  // Admin verification fields (for turf owners)
  isVerifiedByAdmin?: boolean;
  paymentVerified?: boolean;
  paymentDetails?: {
    amount?: number;
    date?: Date;
    transactionId?: string;
    method?: string; // e.g., 'UPI', 'Bank Transfer', 'Cash'
  };
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  verifiedBy?: string; // Admin UID who verified
  verifiedAt?: Date;
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
  businessName: String, // Only for owners
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
    enum: ['basic', 'premium'],
    required: function(this: IUser): boolean {
      return this.role === 'owner' && this.verificationStatus !== 'pending';
    }
  },
  subscriptionAmount: {
    type: Number,
    min: 0
  },
  paymentScreenshot: {
    type: CloudinaryImageSchema,
    required: function(this: IUser): boolean {
      return this.role === 'owner' && this.subscriptionPlan !== undefined;
    }
  },
  
  // Admin verification fields (for turf owners)
  isVerifiedByAdmin: {
    type: Boolean,
    default: function(this: IUser): boolean {
      // Auto-approve customers and admins, require verification for owners
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
  verifiedBy: String, // Admin UID who verified
  verifiedAt: Date
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Create indexes for faster queries (email and uid already have unique indexes)
UserSchema.index({ role: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
