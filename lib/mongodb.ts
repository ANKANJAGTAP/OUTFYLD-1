import { MongoClient } from "mongodb";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'turf_booking';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // Allows attaching to the global object in development mode
  // @ts-ignore
  var _mongoClientPromise: Promise<MongoClient>;
  var _mongoose: any;
}

// Lazy initialization function for MongoDB Client
function getMongoClientPromise() {
  if (!uri) {
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
       throw new Error("Please add MONGODB_URI to your .env.local file");
    }
    return Promise.resolve(null as unknown as MongoClient);
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    client = new MongoClient(uri);
    return client.connect();
  }
}

clientPromise = new Proxy({} as Promise<MongoClient>, {
  get: (target, prop) => getMongoClientPromise()[prop as keyof Promise<MongoClient>]
});

// Mongoose Connection (for schema-based operations)
export const connectMongoDB = async () => {
  try {
    console.log('🔗 Attempting MongoDB connection...');
    console.log('URI exists:', !!uri);
    console.log('DB Name:', dbName);
    
    // Connection options with better timeout settings
    const options = {
      dbName: dbName,
      serverSelectionTimeoutMS: 30000, // 30 seconds to select a server
      connectTimeoutMS: 30000, // 30 seconds to establish connection
      socketTimeoutMS: 45000, // 45 seconds for socket operations
    };
    
    if (process.env.NODE_ENV === "development") {
      if (!global._mongoose) {
        console.log('🆕 Creating new Mongoose connection...');
        // Ensure we're connecting to the correct database
        global._mongoose = mongoose.connect(uri as string, options);
      } else {
        console.log('♻️ Reusing existing Mongoose connection...');
      }
      const connection = await global._mongoose;
      console.log('✅ MongoDB connected successfully via Mongoose');
      console.log('Connected to database:', connection.connection.db?.databaseName);
      return connection;
    } else {
      console.log('🚀 Production Mongoose connection...');
      const connection = await mongoose.connect(uri as string, options);
      console.log('✅ MongoDB connected successfully via Mongoose (production)');
      return connection;
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

export default clientPromise;
