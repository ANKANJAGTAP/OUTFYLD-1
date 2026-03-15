import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { connectMongoDB } from './lib/mongodb';
import Turf from './app/models/Turf';
async function run() {
  await connectMongoDB();
  const ts = await Turf.find({}).lean();
  console.log("Turf count:", ts.length);
  if(ts.length > 0) {
     console.log(ts.map(t => ({ id: t._id, name: t.name, ownerUid: t.ownerUid, ownerId: t.ownerId, contactInfo: t.contactInfo })));
  }
  process.exit(0);
}
run();
