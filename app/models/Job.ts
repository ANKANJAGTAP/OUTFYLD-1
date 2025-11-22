import mongoose, { Document, Schema } from 'mongoose';

// Interface for Job document
export interface IJob extends Document {
  title: string;
  department: 'Frontend Intern' | 'Backend Intern' | 'Full Stack Developer Intern';
  location: string;
  employmentType: 'Internship' | 'Full-time' | 'Part-time';
  description: string;
  requirements: string[]; // Required field - array of job requirements
  stipend: {
    amount: string; // e.g., "10k", "15-20k"
    type: string; // e.g., "Performance based", "Fixed", "Unpaid"
  };
  internshipYear?: string; // Year for which internship is open (e.g., "2025", "2026")
  openings: number;
  deadline?: Date;
  status: 'open' | 'closed'; // Removed 'draft' - jobs post directly as 'open'
  postedBy: mongoose.Types.ObjectId; // Admin who posted
  createdAt: Date;
  updatedAt: Date;
}

// Job Schema
const JobSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [100, 'Job title cannot exceed 100 characters']
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['Frontend Intern', 'Backend Intern', 'Full Stack Developer Intern']
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    employmentType: {
      type: String,
      required: [true, 'Employment type is required'],
      enum: ['Internship', 'Full-time', 'Part-time']
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      minlength: [50, 'Description must be at least 50 characters']
    },
    requirements: {
      type: [{
        type: String,
        trim: true
      }],
      required: [true, 'Requirements are required'],
      validate: {
        validator: function(arr: string[]) {
          return arr && arr.length > 0;
        },
        message: 'At least one requirement must be specified'
      }
    },
    stipend: {
      amount: {
        type: String,
        required: [true, 'Stipend amount is required'],
        trim: true
      },
      type: {
        type: String,
        required: [true, 'Stipend type is required'],
        trim: true
      }
    },
    internshipYear: {
      type: String,
      trim: true
    },
    openings: {
      type: Number,
      required: [true, 'Number of openings is required'],
      min: [1, 'Must have at least 1 opening'],
      default: 1
    },
    deadline: {
      type: Date
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open'
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
JobSchema.index({ status: 1, department: 1 });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ deadline: 1 });

// Export the model
const Job = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);

export default Job;
