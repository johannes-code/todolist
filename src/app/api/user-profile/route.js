// app/api/user-profile/route.js
import { connectToDB } from "@/app/lib/db";

import { getInternalUserId } from "@/app/lib/user-mapping";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request) {
  try {
    log("GET /api/user-profile request received");

    await connectToDB();
    const { userId: clerkId } = auth();

    if (!clerkId) {
      logError("Unauthorized: No Clerk ID found in request");
      return NextResponse.json({ logError: "Unauthorized" }, { status: 401 });
    }

    log("Authenticated with Clerk ID:", clerkId);

    const internalUserId = await getInternalUserId(clerkId);

    if (!internalUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = await User.findById(internalUserId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id,
      createdAt: user.createdAt,
    });
  } catch (error) {
    logError("Error fetching user profile:", error);
    return NextResponse.logEson(
      { error: "Failed to fetch user profile: " + error.message },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request) {
  try {
    log("PUT /api/user-profile request received");

    await connectToDB();
    const { userId: clerkId } = auth();

    if (!clerkId) {
      logError("Unauthorized: No Clerk ID found in request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 404 });
    }

    // Get internal user ID
    const internalUserId = await getInternalUserId(clerkId);

    if (!internalUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updates = await request.json();

    const allowedUpdates = {};

    const updatedUser = await User.findByIdAndUpdate(
      internalUserId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: updatedUser._id,
      createdAt: updatedUser.createdAt,
    });
  } catch (error) {
    logError("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile: " + error.message },
      { status: 500 }
    );
  }
}
