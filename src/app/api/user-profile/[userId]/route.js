// /api/user-profile/[userId]/route.js

import UserProfile from "@/models/UserProfile";
import { connectToDB } from "@/app/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";

export async function GET(request, { params }) {
  try {
    await connectToDB();

    const { userId } = await params;
    const currentAuth = await auth();

    if (!currentAuth?.userId || currentAuth.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userProfile = await UserProfile.findOne({ userId }).lean();

    // If not found, create a new user profile with only kdkSalt and hasEncryptedKey: false
    if (!userProfile) {
      console.log("User profile not found, creating a new one with kdkSalt.");
      const kdkSalt = crypto.randomBytes(16);
      const newUserProfile = new UserProfile({
        userId,
        kdkSalt,
        hasEncryptedKey: false,
      });
      await newUserProfile.save();
      userProfile = newUserProfile.toObject();
      console.log("New user profile created with kdkSalt:", newUserProfile);
    }

    console.log(
      "User profile kdkSalt",
      userProfile.kdkSalt ? userProfile.kdkSalt.toString("base64") : null
    );
    console.log("User profile hasEncryptedKey", userProfile.hasEncryptedKey);

    return NextResponse.json({
      kdk: null, // KDK will be derived in the browser
      kdkSalt: userProfile.kdkSalt
        ? userProfile.kdkSalt.toString("base64")
        : null,
      hasEncryptedKey: userProfile.hasEncryptedKey,
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
