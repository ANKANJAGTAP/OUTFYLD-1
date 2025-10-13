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
  };
  status: 'pending' | 'confirmed' | 'rejected';
  paymentScreenshot: {
    url: string;
    public_id: string;
  };
  totalAmount: number;
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
  }
}, { _id: false });

// Subdocument schema for Cloudinary payment screenshot
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
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending',
    required: true
  },
  paymentScreenshot: {
    type: PaymentScreenshotSchema,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Create indexes for faster queries
BookingSchema.index({ customerId: 1 });
BookingSchema.index({ ownerId: 1 });
BookingSchema.index({ turfId: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ 'slot.day': 1, 'slot.startTime': 1 });

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