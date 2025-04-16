import { NextResponse } from "next/server";
import { connectToDB } from "@/app/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = params;
    console.log("API - Recieved userId:", userId);

    await connectToDB();
    const mongoose = (await import("mongoose")).default;
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ userId: userId });
    console.log("API - User found:", user);

    let hasEcryptedKey = false;
    if (
      user &&
      user.encryptedKey &&
      Object.keys(user.encryptedKey).length > 0
    ) {
      hasEcryptedKey = true;
    }
    return NextResponse.json({ hasEcryptedKey }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
