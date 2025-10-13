/**
 * Script to fix turfs with missing location.city
 * 
 * This script updates all turfs in the database that have missing or empty
 * location.city field with a default value of "To Be Updated"
 * 
 * Run this once to fix existing data:
 * npx ts-node --compiler-options '{"module":"commonjs"}' scripts/fix-turf-locations.ts
 */

import mongoose from 'mongoose';

// MongoDB connection string - update if different
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/turf_booking';

interface ITurf {
  _id: mongoose.Types.ObjectId;
  name: string;
  location: {
    city?: string;
    address?: string;
    state?: string;
    pincode?: string;
  };
}

async function fixTurfLocations() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Turf = mongoose.model('Turf');

    // Find turfs with missing or empty location.city
    const turfsWithoutCity = await Turf.find({
      $or: [
        { 'location.city': { $exists: false } },
        { 'location.city': null },
        { 'location.city': '' }
      ]
    }).lean() as ITurf[];

    console.log(`📊 Found ${turfsWithoutCity.length} turfs without proper location.city\n`);

    if (turfsWithoutCity.length === 0) {
      console.log('✅ All turfs have proper location data!');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('🔧 Fixing turfs...\n');

    let fixed = 0;
    let failed = 0;

    for (const turf of turfsWithoutCity) {
      try {
        const result = await Turf.updateOne(
          { _id: turf._id },
          {
            $set: {
              'location.city': 'To Be Updated',
              'location.address': turf.location?.address || 'To Be Updated',
              'location.state': turf.location?.state || 'To Be Updated'
            }
          }
        );

        if (result.modifiedCount > 0) {
          console.log(`✅ Fixed: ${turf.name} (${turf._id})`);
          fixed++;
        } else {
          console.log(`⚠️  Already fixed: ${turf.name} (${turf._id})`);
        }
      } catch (error: any) {
        console.error(`❌ Failed to fix ${turf.name}: ${error.message}`);
        failed++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ⚠️  Already fixed: ${turfsWithoutCity.length - fixed - failed}`);
    console.log(`   ❌ Failed: ${failed}`);

    console.log('\n🔔 IMPORTANT: Turf owners should update their location data properly!');
    console.log('   Turfs with "To Be Updated" should be edited with correct city, address, and state.');

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
fixTurfLocations();
