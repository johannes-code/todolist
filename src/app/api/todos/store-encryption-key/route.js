// app/api/store-encryption-key/route.js
import { NextResponse } from "next/server";
import { connectToDB } from "@/app/lib/db";

export async function POST(request) {
  console.log("API - /api/store-encryption-key called"); // Added log
  try {
    const { userId, exportedKey } = await request.json();
    console.log("API - /api/store-encryption-key - userId:", userId); // Added log
    console.log("API - /api/store-encryption-key - exportedKey:", exportedKey); // Added log

    if (!userId || !exportedKey) {
      console.log("API - /api/store-encryption-key - Missing userId or exportedKey"); // Added log
      return NextResponse.json(
        { error: "Missing userId or exportedKey" },
        { status: 400 }
      );
    }

    await connectToDB();
    const mongoose = (await import("mongoose")).default;
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");
    console.log("API - /api/store-encryption-key - Connected to collection: users"); // Added log

    // Check if a user with this userId already exists
    const existingUser = await usersCollection.findOne({ userId: userId });
    console.log("API - /api/store-encryption-key - Existing user:", existingUser); // Added log

    if (!existingUser) {
      // Create a new user document
      const insertResult = await usersCollection.insertOne({
        userId: userId,
        encryptedKey: exportedKey, 
      });
      console.log("API - /api/store-encryption-key - Insert result:", insertResult); 
      console.log(`API - /api/store-encryption-key - Encryption key stored for new user: ${userId}`);
      return NextResponse.json({ message: "Encryption key stored for new user" }, { status: 201 });
    } else {
      // Update the existing user's document
      const updateResult = await usersCollection.updateOne(
        { userId: userId },
        { $set: { encryptedKey: exportedKey } } 
      );
      console.log("API - /api/store-encryption-key - Update result:", updateResult);
      console.log(`API - /api/store-encryption-key - Encryption key updated for existing user: ${userId}`);
      return NextResponse.json({ message: "Encryption key updated" }, { status: 200 });
    }
  } catch (error) {
    console.error("API - /api/store-encryption-key - Error storing encryption key:", error); 
    return NextResponse.json(
      { error: "Failed to store encryption key" },
      { status: 500 }
    );
  }
}