import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import JobApplication from '@/app/models/JobApplication';
import Job from '@/app/models/Job';

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    const { targetJobIds } = await request.json();

    if (!targetJobIds || !Array.isArray(targetJobIds) || targetJobIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one target job ID is required' },
        { status: 400 }
      );
    }

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

    // Find duplicates (candidates with multiple applications)
    const duplicateCandidates = new Map<string, any[]>();

    // Check email-based duplicates
    emailGroups.forEach((apps, email) => {
      if (apps.length > 1) {
        duplicateCandidates.set(`email:${email}`, apps);
      }
    });

    // Check phone-based duplicates
    phoneGroups.forEach((apps, phone) => {
      if (apps.length > 1) {
        // Check if not already added via email
        const existingKey = Array.from(duplicateCandidates.keys()).find(key => {
          const existingApps = duplicateCandidates.get(key)!;
          return existingApps.some(ea => apps.some(a => a._id.equals(ea._id)));
        });

        if (!existingKey) {
          duplicateCandidates.set(`phone:${phone}`, apps);
        }
      }
    });

    // Find applications to delete
    const applicationsToDelete: string[] = [];
    let duplicatesProcessed = 0;

    duplicateCandidates.forEach((apps, key) => {
      // Check if any application is for one of the target jobs
      const targetJobApps = apps.filter(app => 
        targetJobIds.includes(app.jobId._id.toString())
      );

      if (targetJobApps.length > 0) {
        // Keep all target job applications, delete others
        apps.forEach(app => {
          if (!targetJobIds.includes(app.jobId._id.toString())) {
            applicationsToDelete.push(app._id.toString());
          }
        });
        duplicatesProcessed++;
      }
    });

    // Hard delete the applications
    if (applicationsToDelete.length > 0) {
      await JobApplication.deleteMany({
        _id: { $in: applicationsToDelete }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${applicationsToDelete.length} duplicate applications`,
      duplicatesProcessed,
      applicationsDeleted: applicationsToDelete.length
    });

  } catch (error) {
    console.error('Error removing duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to remove duplicates' },
      { status: 500 }
    );
  }
}
