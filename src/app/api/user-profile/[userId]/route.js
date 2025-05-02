// /api/user-profile/[userId]/route.js

import UserProfile from "@/models/UserProfile";
import { connectToDB } from "@/app/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";

export async function GET(request, { params }) {
  try {
    await connectToDB(); // Connect at the beginning

    const { userId } = await params;
    const currentAuth = await auth();

    if (!currentAuth?.userId || currentAuth.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userProfile = await UserProfile.findOne({ userId }).lean();

    //If not found create a new user profile
    if (!userProfile) {
      console.log("User profile not found, creating a new one.");
      const kdkSalt = crypto.randomBytes(16);
      const kdk = crypto.pbkdf2Sync(
        userId, // Use userId as password
        kdkSalt,
        100000, // Iterations
        32, // Key length
        "sha256"
      );
      const newUserProfile = new UserProfile({ userId, kdk, kdkSalt });
      await newUserProfile.save();
      userProfile = newUserProfile.toObject();
      console.log("New user profile created:", newUserProfile);
    }

    console.log(
      "User profile kdk",
      userProfile.kdk ? userProfile.kdk.toString("base64") : null
    );
    console.log(
      "User profile kdkSalt",
      userProfile.kdkSalt ? userProfile.kdkSalt.toString("base64") : null
    );
    console.log("User profile hasEncryptedKey", !!userProfile.kdk);

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
