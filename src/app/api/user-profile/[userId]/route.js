// /api/user-profile/[userId]/route.js

import UserProfile from "@/models/UserProfile";
import { connectToDB } from "@/app/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request, { params }) {
  try {
    await connectToDB(); // Connect at the beginning

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

    return NextResponse.json({
      kdk: userProfile.kdk ? userProfile.kdk.toString("base64") : null,
      kdkSalt: userProfile.kdkSalt
        ? userProfile.kdkSalt.toString("base64")
        : null,
      hasEncryptedKey: !!userProfile.kdk,
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
