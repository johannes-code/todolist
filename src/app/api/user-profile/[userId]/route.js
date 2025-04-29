// /pages/api/user-profile/[userId].js

import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/app/lib/db";
import UserProfile from "@/models/UserProfile";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    await connectToDB();
    const { userId } = params;
    const currentAuth = await auth();

    if (!currentAuth?.userId || currentAuth.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await UserProfile.findOne({ userId }).lean();

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Include kdk and kdkSalt in the response
    return NextResponse.json({
      kdk: userProfile.kdk ? userProfile.kdk.toString("base64") : null,
      kdkSalt: userProfile.kdkSalt
        ? userProfile.kdkSalt.toString("base64")
        : null,
      // Include other profile data as needed
      hasEncryptedKey: !!userProfile.kdk, // Update this based on KDK presence
      // ... other profile fields ...
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
