import mongoose, { Document, Schema } from 'mongoose';

// Interface for SubscriptionPayment document
export interface ISubscriptionPayment extends Document {
  ownerUid: string;
  ownerId: mongoose.Types.ObjectId;
  plan: 'starter' | 'pro';
  amount: number;
  durationMonths: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  isUpgrade: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPaymentSchema = new Schema<ISubscriptionPayment>(
  {
    ownerUid: {
      type: String,
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: String,
      enum: ['starter', 'pro'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    durationMonths: {
      type: Number,
      required: true,
      enum: [6, 12],
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
    razorpaySignature: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    subscriptionStartDate: {
      type: Date,
    },
    subscriptionEndDate: {
      type: Date,
    },
    isUpgrade: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SubscriptionPaymentSchema.index({ paymentStatus: 1, createdAt: -1 });
// razorpayPaymentId index removed — sparse:true on the field already creates one

const SubscriptionPayment =
  mongoose.models.SubscriptionPayment ||
  mongoose.model<ISubscriptionPayment>('SubscriptionPayment', SubscriptionPaymentSchema);

export default SubscriptionPayment;
