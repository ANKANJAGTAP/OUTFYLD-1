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

// Interface for Settings document
interface ISettings extends Document {
  adminPaymentQR: {
    url: string;
    public_id: string;
  };
  updatedBy?: string; // Admin UID who updated
  updatedAt?: Date;
}

const SettingsSchema = new mongoose.Schema({
  adminPaymentQR: {
    type: CloudinaryImageSchema,
    required: true
  },
  updatedBy: String,
  updatedAt: Date
}, {
  timestamps: true
});

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
