import mongoose from 'mongoose';

const SlotReservationSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    index: true
  },
  turfId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Turf',
    required: true,
    index: true
  },
  slot: {
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    date: { type: String, required: true } // YYYY-MM-DD format
  },
  reservedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for automatic cleanup
  }
});

// Compound index for efficient slot lookup
SlotReservationSchema.index({ 
  turfId: 1, 
  'slot.date': 1, 
  'slot.startTime': 1, 
  'slot.endTime': 1 
});

// Unique index to prevent duplicate reservations for the same slot
SlotReservationSchema.index({ 
  turfId: 1, 
  'slot.date': 1, 
  'slot.startTime': 1, 
  'slot.endTime': 1 
}, { unique: true });

const SlotReservation = mongoose.models.SlotReservation || mongoose.model('SlotReservation', SlotReservationSchema);

export default SlotReservation;