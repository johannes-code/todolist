// /pages/api/generate-kdk.js
import { connectToDB } from "@/app/lib/db";
import UserProfile from "@/models/UserProfile";
import { randomBytes, pbkdf2Sync } from "crypto";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(request) {
  try {
    await connectToDB();
    const user = await currentUser(); // Get the current user

    if (!user) {
      console.log("API - Generate KDK: Unauthorized - User not logged in");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const kdkSalt = randomBytes(16);
    const kdk = pbkdf2Sync(
      userId, // Use userId as password
      kdkSalt,
      100000, // Iterations
      32, // Key length
      "sha256"
    );

    const userProfile = await UserProfile.findOneAndUpdate(
      { userId },
      { kdk, salt: kdkSalt },
      { new: true, upsert: true }
    );

    if (!userProfile) {
      console.error(
        `API - Generate KDK: Failed to find or create profile for user ${userId}`
      );
      return NextResponse.json(
        { error: "Failed to update user profile with KDK" },
        { status: 500 }
      );
    }

    console.log(
      `API - Generate KDK: Successfully stored KDK for user ${userId}`
    );
    return NextResponse.json({ message: "KDK generated and stored" });
  } catch (error) {
    console.error("API - Generate KDK: Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error while generating KDK" },
      { status: 500 }
    );
  }
}
