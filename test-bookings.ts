import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { connectMongoDB } from './lib/mongodb';
import Booking from './app/models/Booking';
import Turf from './app/models/Turf';

async function run() {
  await connectMongoDB();
  const bs: any[] = await Booking.find().populate('turfId', 'name contactInfo location').lean();
  console.log("Bookings count:", bs.length);
  if(bs.length > 0) {
     console.log(bs.slice(0, 3).map(b => ({
       id: b._id.toString(),
       turfId: b.turfId,
       slot: b.slot
     })));
  }
  process.exit(0);
}
run();
