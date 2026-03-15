const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const Turf = require("./app/models/Turf");
const User = require("./app/models/User");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");
  // We need to compile TS for this or just use native mongodb
  const turfs = await mongoose.connection.db.collection("turfs").find().toArray();
  console.log("Turfs raw:", JSON.stringify(turfs, null, 2));
  
  await mongoose.disconnect();
}
run();
