import mongoose, { Document, Schema } from 'mongoose';

// Cloudinary resume schema
const CloudinaryResumeSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  public_id: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  }
}, { _id: false });

// Interface for JobApplication document
export interface IJobApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // Optional - if user is logged in
  
  // Personal Information
  fullName: string;
  email: string;
  phone: string;
  college: string; // College/University name - REQUIRED
  branch: string; // Branch/Stream (e.g., Computer Science, IT, Mechanical) - REQUIRED
  graduationYear: string; // Year of graduation (e.g., "2025", "2026") - REQUIRED
  availability?: string; // When they can join (e.g., "Immediate", "2 weeks", "After semester")
  
  // Application Materials
  resume: {
    url: string;
    public_id: string;
    fileName: string;
    fileSize: number;
  };
  coverLetter?: string;
  
  // Required URLs
  linkedinUrl: string; // Now required
  githubUrl: string; // Now required
  portfolioUrl?: string; // Optional
  
  // Voluntary Disclosure (EEO)
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say'; // Required
  disabilityStatus: 'Yes' | 'No' | 'Prefer not to say'; // Required
  veteranStatus?: 'Yes' | 'No' | 'Prefer not to say'; // Optional
  
  // Work Experience (Optional)
  workExperience?: {
    company: string;
    role: string;
    duration: string; // e.g., "6 months", "1 year"
    description: string;
  };
  
  // Application Status
  status: 'submitted' | 'under_review' | 'shortlisted_email_sent' | 'offer_sent' | 'offer_accepted' | 'rejected' | 'hired';
  appliedDate: Date;
  
  // Offer Letter & Acceptance
  offerLetterId?: string; // Format: OUTFYLD-INF-2025-1234
  offerLetterGeneratedAt?: Date;
  offerLetterPdfUrl?: string; // Cloudinary URL
  
  offerAccepted?: boolean;
  offerAcceptedAt?: Date;
  offerAcceptanceStatus?: 'pending' | 'accepted' | 'expired'; // Track acceptance status
  offerExpiryDate?: Date; // 7 days from shortlist date
  
  // Signature & Verification
  currentAddress?: string; // Candidate's current residential address
  signatureUrl?: string; // Cloudinary URL for signature image
  signedAt?: Date;
  
  // Payment Details
  paymentStatus?: 'pending' | 'completed' | 'failed';
  paymentAmount?: number; // 249
  paymentTransactionId?: string;
  paymentDate?: Date;
  paymentAttempts?: number; // Track retry attempts
  paymentReceiptUrl?: string; // Cloudinary URL
  
  // Internship Details
  preferredStartDate?: Date;
  internshipStartDate?: Date; // Final confirmed start date
  internshipEndDate?: Date;
  joiningLetterUrl?: string; // Cloudinary URL for joining letter PDF
  
  // Admin Management
  adminNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  
  // Metadata
  source: string; // 'website', 'linkedin', 'referral'
  ipAddress?: string;
  userAgent?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// JobApplication Schema
const JobApplicationSchema = new Schema<IJobApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Personal Information
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number']
    },
    college: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      maxlength: [200, 'College name cannot exceed 200 characters']
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
      maxlength: [100, 'Branch name cannot exceed 100 characters']
    },
    graduationYear: {
      type: String,
      required: [true, 'Graduation year is required'],
      trim: true
    },
    availability: {
      type: String,
      trim: true,
      maxlength: [100, 'Availability cannot exceed 100 characters']
    },
    
    // Application Materials
    resume: {
      type: CloudinaryResumeSchema,
      required: [true, 'Resume is required']
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
    },
    
    // Required URLs
    linkedinUrl: {
      type: String,
      required: [true, 'LinkedIn URL is required'],
      trim: true,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.*$/, 'Please enter a valid LinkedIn URL']
    },
    githubUrl: {
      type: String,
      required: [true, 'GitHub URL is required'],
      trim: true,
      match: [/^https?:\/\/(www\.)?github\.com\/.*$/, 'Please enter a valid GitHub URL']
    },
    portfolioUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.*$/, 'Please enter a valid URL']
    },
    
    // Voluntary Disclosure (EEO)
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other', 'Prefer not to say']
    },
    disabilityStatus: {
      type: String,
      required: [true, 'Disability status is required'],
      enum: ['Yes', 'No', 'Prefer not to say']
    },
    veteranStatus: {
      type: String,
      enum: ['Yes', 'No', 'Prefer not to say']
    },
    
    // Work Experience (Optional structured)
    workExperience: {
      company: {
        type: String,
        trim: true,
        maxlength: [100, 'Company name cannot exceed 100 characters']
      },
      role: {
        type: String,
        trim: true,
        maxlength: [100, 'Role cannot exceed 100 characters']
      },
      duration: {
        type: String,
        trim: true,
        maxlength: [50, 'Duration cannot exceed 50 characters']
      },
      description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
      }
    },
    
    // Application Status
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'shortlisted_email_sent', 'offer_sent', 'offer_accepted', 'rejected', 'hired'],
      default: 'submitted'
    },
    appliedDate: {
      type: Date,
      default: Date.now
    },
    
    // Offer Letter & Acceptance
    offerLetterId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true // Allow null values to be non-unique
    },
    offerLetterGeneratedAt: {
      type: Date
    },
    offerLetterPdfUrl: {
      type: String
    },
    
    offerAccepted: {
      type: Boolean,
      default: false
    },
    offerAcceptedAt: {
      type: Date
    },
    offerAcceptanceStatus: {
      type: String,
      enum: ['pending', 'accepted', 'expired'],
      default: 'pending'
    },
    offerExpiryDate: {
      type: Date
    },
    
    // Signature & Verification
    currentAddress: {
      type: String
    },
    signatureUrl: {
      type: String
    },
    signedAt: {
      type: Date
    },
    
    // Payment Details
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    paymentAmount: {
      type: Number,
      default: 249
    },
    paymentTransactionId: {
      type: String
    },
    paymentDate: {
      type: Date
    },
    paymentAttempts: {
      type: Number,
      default: 0
    },
    paymentReceiptUrl: {
      type: String
    },
    
    // Internship Details
    preferredStartDate: {
      type: Date
    },
    internshipStartDate: {
      type: Date
    },
    internshipEndDate: {
      type: Date
    },
    joiningLetterUrl: {
      type: String
    },
    
    // Admin Management
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    
    // Metadata
    source: {
      type: String,
      default: 'website',
      enum: ['website', 'linkedin', 'referral']
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
JobApplicationSchema.index({ jobId: 1, status: 1 });
JobApplicationSchema.index({ email: 1 });
JobApplicationSchema.index({ userId: 1 });
JobApplicationSchema.index({ appliedDate: -1 });
JobApplicationSchema.index({ status: 1, appliedDate: -1 });

// Prevent duplicate applications from same email for same job
JobApplicationSchema.index({ jobId: 1, email: 1 }, { unique: true });

// Export the model
const JobApplication = mongoose.models.JobApplication || mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema);

export default JobApplication;
