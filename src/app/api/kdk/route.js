// /pages/api/generate-kdk.js
import { connectToDB } from "@/app/lib/db";
import UserProfile from "@/models/UserProfile";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(request) {
  try {
    await connectToDB();
    const user = await currentUser();

    if (!user) {
      console.log("API - Generate KDK Salt: Unauthorized - User not logged in");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const kdkSalt = randomBytes(16);

    const userProfile = await UserProfile.findOneAndUpdate(
      { userId },
      { kdkSalt, hasEncryptedKey: true },
      { new: true, upsert: true }
    );

    if (!userProfile) {
      console.error(
        `API - Generate KDK Salt: Failed to find or create profile for user ${userId}`
      );
      return NextResponse.json(
        { error: "Failed to update user profile with KDK Salt" },
        { status: 500 }
      );
    }

    console.log(
      `API - Generate KDK Salt: Successfully stored KDK Salt for user ${userId}`
    );
    return NextResponse.json({ message: "KDK Salt generated and stored" });
  } catch (error) {
    console.error("API - Generate KDK Salt: Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error while generating KDK Salt" },
      { status: 500 }
    );
  }
}
