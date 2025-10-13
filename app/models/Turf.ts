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

// Interface for Turf document
interface ITurf extends Document {
  ownerId: string; // Reference to User._id
  ownerUid: string; // Reference to User.uid (Firebase UID)
  name: string;
  description: string;
  images: Array<{
    url: string;
    public_id: string;
  }>;
  sportsOffered: string[];
  customSport?: string;
  amenities: string[];
  availableSlots: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
  pricing: number;
  location: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  contactInfo: {
    phone: string;
    email: string;
    businessName: string;
  };
  paymentInfo: {
    upiQrCode: {
      url: string;
      public_id: string;
    };
  };
  isActive: boolean;
  rating?: number;
  reviewCount?: number;
  featuredImage?: string; // Main display image URL
}

const TurfSchema = new mongoose.Schema({
  // Owner reference
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  ownerUid: {
    type: String,
    required: true
  },
  
  // Basic turf information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Media
  images: {
    type: [CloudinaryImageSchema],
    required: true,
    validate: {
      validator: function(images: any[]): boolean {
        return images && images.length > 0;
      },
      message: 'At least one turf image is required'
    }
  },
  featuredImage: {
    type: String, // URL of the main display image
    required: true
  },
  
  // Sports and amenities
  sportsOffered: {
    type: [String],
    enum: ['Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball', 'Other'],
    required: true,
    validate: {
      validator: function(sports: string[]): boolean {
        return sports && sports.length > 0;
      },
      message: 'At least one sport must be selected'
    }
  },
  customSport: {
    type: String,
    required: function(this: ITurf): boolean {
      return Boolean(this.sportsOffered && this.sportsOffered.includes('Other'));
    }
  },
  amenities: {
    type: [String],
    enum: ['Floodlights', 'Parking', 'Washroom', 'Equipment'],
    default: []
  },
  
  // Scheduling and pricing
  availableSlots: {
    type: [TimeSlotSchema],
    required: true,
    validate: {
      validator: function(slots: any[]): boolean {
        return slots && slots.length > 0;
      },
      message: 'At least one time slot is required'
    }
  },
  pricing: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Location details
  location: {
    address: String,
    city: {
      type: String,
      required: true
    },
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Contact information
  contactInfo: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    businessName: {
      type: String,
      required: true
    }
  },
  
  // Payment information
  paymentInfo: {
    upiQrCode: {
      type: CloudinaryImageSchema,
      required: true
    }
  },
  
  // Status and ratings
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Create indexes for better query performance
TurfSchema.index({ ownerId: 1 });
TurfSchema.index({ ownerUid: 1 });
TurfSchema.index({ 'location.city': 1 });
TurfSchema.index({ sportsOffered: 1 });
TurfSchema.index({ pricing: 1 });
TurfSchema.index({ rating: -1 });
TurfSchema.index({ isActive: 1 });
TurfSchema.index({ createdAt: -1 });

// Compound indexes for common queries
TurfSchema.index({ 'location.city': 1, isActive: 1 });
TurfSchema.index({ sportsOffered: 1, 'location.city': 1 });
TurfSchema.index({ pricing: 1, 'location.city': 1 });

// Pre-save middleware to set featured image
TurfSchema.pre('save', function(this: ITurf, next) {
  // Set featured image to the first image if not already set
  if (this.images && this.images.length > 0 && !this.featuredImage) {
    this.featuredImage = this.images[0].url;
  }
  next();
});

export default mongoose.models.Turf || mongoose.model<ITurf>('Turf', TurfSchema);