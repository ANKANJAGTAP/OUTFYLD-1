import { MongoClient } from "mongodb";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'turf_booking';

if (!uri) {
  throw new Error("Please add MONGODB_URI to your .env.local file");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // Allows attaching to the global object in development mode
  // @ts-ignore
  var _mongoClientPromise: Promise<MongoClient>;
  var _mongoose: any;
}

// MongoDB Client Connection (for direct MongoDB operations)
if (process.env.NODE_ENV === "development") {
  // In development, use a global variable so the client is not recreated on every file change
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new MongoClient instance
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// Mongoose Connection (for schema-based operations)
export const connectMongoDB = async () => {
  try {
    console.log('🔗 Attempting MongoDB connection...');
    console.log('URI exists:', !!uri);
    console.log('DB Name:', dbName);
    
    if (process.env.NODE_ENV === "development") {
      if (!global._mongoose) {
        console.log('🆕 Creating new Mongoose connection...');
        // Ensure we're connecting to the correct database
        global._mongoose = mongoose.connect(uri, {
          dbName: dbName
        });
      } else {
        console.log('♻️ Reusing existing Mongoose connection...');
      }
      const connection = await global._mongoose;
      console.log('✅ MongoDB connected successfully via Mongoose');
      console.log('Connected to database:', connection.connection.db?.databaseName);
      return connection;
    } else {
      console.log('🚀 Production Mongoose connection...');
      const connection = await mongoose.connect(uri, {
        dbName: dbName
      });
      console.log('✅ MongoDB connected successfully via Mongoose (production)');
      return connection;
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

export default clientPromise;
