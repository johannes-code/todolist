// api/kdk/generate-kdk.js

import UserProfile from "@/models/UserProfile";
import { currentUser } from "@clerk/nextjs/dist/types/server";
import { pbkdf2, pbkdf2Sync, randomBytes } from "crypto";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await connectionToDB();
    const user = await currentUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unautorized" }), {
        status: 401,
      });
    }

    const userId = user.id;

    const salt = randomBytes(16);
    const kdk = pbkdf2Sync(userId, salt, 10000, 32, "sha256");

    const userProfile = await UserProfile.findOneAndUpdate(
      { userId },
      { kdk, kdkSalt },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      message: "KDK generated and stored successfully",
    });
  } catch (error) {
    console.error("Error generating KDK:", error);
    return new Response(JSON.stringify({ error: "Failed to generate KDK" }), {
      status: 500,
    });
  }
}
