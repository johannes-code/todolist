import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDB } from "@/app/lib/db"; // Adjust path if needed
import UserProfile from "@/models/UserProfile"; // Adjust path if needed

export async function GET(request, { params }) {
  // Destructure params
  try {
    const requestedUserId = params.userId; // Access userId directly
    // console.log("API - Get Profile: Requested userId:", requestedUserId); // Optional logging

    const user = await currentUser();
    if (!user) {
      // console.log("API - Get Profile: Unauthorized - User not logged in");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (requestedUserId !== user.id) {
      // console.log("API - Get Profile: Forbidden - Attempt to access other user's profile");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectToDB();

    let userProfile = await UserProfile.findOne({ userId: requestedUserId });

    if (!userProfile) {
      // Decide if GET should create profile or return 404
      // Option 1: Return 404 Not Found
      // console.log(`API - Get Profile: Profile not found for user ${requestedUserId}`);
      // return NextResponse.json({ error: "Profile not found" }, { status: 404 });

      // Option 2: Create Profile (as in your original code)
      console.log(
        `API - Get Profile: Profile not found for ${requestedUserId}, creating...`
      );
      userProfile = await UserProfile.create({
        userId: requestedUserId,
        hasEncryptedKey: false,
        encryptedKey: null, // Ensure model allows null or use Buffer.alloc(0) if required
      });
      console.log(
        `API - Get Profile: Created new profile for ${requestedUserId}`
      );
      // Optionally return status 201 Created
      // return NextResponse.json(userProfile, { status: 201 });
    }

    // console.log(`API - Get Profile: Found profile for user ${requestedUserId}`);
    // Selectively return data if needed, e.g., don't return the actual key in GET
    const profileData = {
      userId: userProfile.userId,
      hasEncryptedKey: userProfile.hasEncryptedKey,
      // DO NOT return userProfile.encryptedKey here unless absolutely necessary
    };

    return NextResponse.json(profileData); // Return safe profile data
  } catch (error) {
    console.error("API - Get Profile: Unexpected error:", error);
    // Add more specific error checking if needed (e.g., database errors)
    return NextResponse.json(
      { error: "Internal server error fetching profile" },
      { status: 500 }
    );
  }
}
