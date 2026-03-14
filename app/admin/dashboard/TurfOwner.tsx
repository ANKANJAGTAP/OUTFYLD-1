'use client';
export interface TurfOwner {
    _id: string;
    uid: string;
    name: string;
    email: string;
    phone?: string;
    businessName?: string;
    subscriptionPlan?: 'basic' | 'premium';
    subscriptionAmount?: number;
    paymentScreenshot?: {
        url: string;
        public_id: string;
    };
    verificationStatus: 'pending' | 'approved' | 'rejected';
    paymentVerified: boolean;
    paymentDetails?: {
        amount?: number;
        date?: Date;
        transactionId?: string;
        method?: string;
    };
    rejectionReason?: string;
    createdAt: Date;
}
