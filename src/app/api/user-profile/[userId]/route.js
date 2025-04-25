import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDB } from "@/app/lib/db";
import UserProfile from "@/models/UserProfile";

export async function GET(request, context) {
  try {
    const requestedUserId = context.params.userId;
    console.log("API - Requested userId:", requestedUserId);

    // Get the authenticated user
    const user = await currentUser();
    if (!user) {
      console.log("API - Unauthorized: User not logged in");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorization check
    if (requestedUserId !== user.id) {
      console.log(
        "API - Forbidden: User attempted to access another user's profile"
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Database connection with error handling
    try {
      await connectToDB();
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Find or create profile
    let userProfile = await UserProfile.findOne({ userId: requestedUserId });

    if (!userProfile) {
      try {
        userProfile = await UserProfile.create({
          userId: requestedUserId,
          hasEncryptedKey: false,
          encryptedKey: null,
        });
      } catch (createError) {
        console.error("Profile creation error:", createError);
        return NextResponse.json(
          { error: "Failed to create profile" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Unexpected error in GET /user-profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
