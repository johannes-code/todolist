// src/app/lib/db.js
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDB() {
  try {
    if (cached.conn) {
      console.log("Using cached database connection");
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
      };

      console.log("Creating new database connection");
      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log("Database connected successfully");
        return mongoose;
      });
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
}
