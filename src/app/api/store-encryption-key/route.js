// api/store-encryption-key/route.js

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDB } from "@/app/lib/db";
import UserProfile from "@/models/UserProfile"; // Make sure this path is correct

export async function POST(request) {
  try {
    // 1. Get Authenticated User
    const user = await currentUser();
    if (!user) {
      console.log("API - Store Key: Unauthorized - User not logged in");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    // 2. Parse Request Body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("API - Store Key: Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { exportedKey } = body; // Expecting an array of numbers from JSON

    if (!exportedKey || !Array.isArray(exportedKey)) {
      console.log(
        "API - Store Key: Bad Request - Missing or invalid exportedKey"
      );
      return NextResponse.json(
        { error: "Missing or invalid exportedKey in request body" },
        { status: 400 }
      );
    }

    // Convert array back to Buffer/Uint8Array for storage
    // Assuming your UserProfile model expects a Buffer for encryptedKey
    const keyBuffer = Buffer.from(exportedKey);

    // 3. Connect to Database
    await connectToDB();

    // 4. Find and Update User Profile
    const userProfile = await UserProfile.findOneAndUpdate(
      { userId: userId },
      {
        $set: {
          encryptedKey: keyBuffer, // Store as Buffer
          hasEncryptedKey: true,
        },
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create if doesn't exist (optional, depends on your logic)
      }
    );

    if (!userProfile) {
      // This should ideally not happen with upsert: true, but handle just in case
      console.error(
        `API - Store Key: Failed to find or create profile for user ${userId}`
      );
      return NextResponse.json(
        { error: "Failed to update user profile" },
        { status: 500 }
      );
    }

    console.log(`API - Store Key: Successfully stored key for user ${userId}`);
    return NextResponse.json({ message: "Encryption key stored successfully" });
  } catch (error) {
    console.error("API - Store Key: Unexpected error:", error);
    // Check if it's a database specific error, e.g., validation error
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: `Validation Error: ${error.message}` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error while storing key" },
      { status: 500 }
    );
  }
}
