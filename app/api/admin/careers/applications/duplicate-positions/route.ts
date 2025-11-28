import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import JobApplication from '@/app/models/JobApplication';
import Job from '@/app/models/Job';

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    // Find all applications
    const allApplications = await JobApplication.find({}).populate('jobId');

    // Group applications by email and phone
    const emailGroups = new Map<string, any[]>();
    const phoneGroups = new Map<string, any[]>();

    allApplications.forEach(app => {
      if (app.email) {
        const email = app.email.toLowerCase().trim();
        if (!emailGroups.has(email)) {
          emailGroups.set(email, []);
        }
        emailGroups.get(email)!.push(app);
      }

      if (app.phone) {
        const phone = app.phone.trim();
        if (!phoneGroups.has(phone)) {
          phoneGroups.set(phone, []);
        }
        phoneGroups.get(phone)!.push(app);
      }
    });

    // Find positions that have duplicates
    const positionsWithDuplicates = new Set<string>();

    // Check email-based duplicates
    emailGroups.forEach((apps, email) => {
      if (apps.length > 1) {
        apps.forEach(app => {
          if (app.jobId && app.jobId._id) {
            positionsWithDuplicates.add(app.jobId._id.toString());
          }
        });
      }
    });

    // Check phone-based duplicates
    phoneGroups.forEach((apps, phone) => {
      if (apps.length > 1) {
        apps.forEach(app => {
          if (app.jobId && app.jobId._id) {
            positionsWithDuplicates.add(app.jobId._id.toString());
          }
        });
      }
    });

    // Get job details for positions with duplicates
    const jobIds = Array.from(positionsWithDuplicates);
    const jobs = await Job.find({ _id: { $in: jobIds } }).select('_id title');

    return NextResponse.json({
      success: true,
      positions: jobs.map(job => ({
        id: job._id.toString(),
        title: job.title
      }))
    });

  } catch (error) {
    console.error('Error fetching duplicate positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch duplicate positions' },
      { status: 500 }
    );
  }
}
