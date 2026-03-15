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
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  }
}, { _id: false });

// Interface for Turf document
interface ITurf extends Document {
  ownerId: string;
  ownerUid: string;
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
  geoLocation?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  locationMetadata?: {
    accuracy: string;
    accuracyRadius: number;
    isOwnerVerified: boolean;
    geocodedBy: string;
    geocodedAt: Date;
  };
  contactInfo: {
    phone: string;
    email: string;
    businessName: string;
  };
  isActive: boolean;
  rating?: number;
  reviewCount?: number;
  featuredImage?: string;
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
    type: String,
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
  
  // Location details (text-based, for display)
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

  // GeoJSON location for geospatial queries (nearest turf)
  geoLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude] — GeoJSON standard
      validate: {
        validator: function(coords: number[]) {
          if (!coords || coords.length !== 2) return true; // Allow empty
          const [lng, lat] = coords;
          return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
        },
        message: 'Invalid coordinates. Must be [longitude, latitude] within valid ranges.'
      }
    }
  },

  // Location quality metadata
  locationMetadata: {
    accuracy: {
      type: String,
      enum: ['ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER', 'APPROXIMATE'],
      default: 'GEOMETRIC_CENTER'
    },
    accuracyRadius: {
      type: Number,
      default: 500
    },
    isOwnerVerified: {
      type: Boolean,
      default: false
    },
    geocodedBy: String,
    geocodedAt: Date
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
  timestamps: true
});

// Basic indexes
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

// Geospatial index for nearest turf queries
TurfSchema.index({ geoLocation: '2dsphere' });

// Pre-save middleware to set featured image
TurfSchema.pre('save', function(this: ITurf, next) {
  if (this.images && this.images.length > 0 && !this.featuredImage) {
    this.featuredImage = this.images[0].url;
  }
  next();
});

export default mongoose.models.Turf || mongoose.model<ITurf>('Turf', TurfSchema);