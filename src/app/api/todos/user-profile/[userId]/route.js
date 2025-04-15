import { NextResponse } from "next/server";
import { connectToDB } from "@/app/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    await connectToDB();
    const mongoose = (await import("mongoose")).default;
    const db = mongoose.connection.db;
    const usersCollection = db.collection("userId");

    const user = await usersCollection.findOne({ userId: userId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const hasEcryptedKey = !!user.encryptedKey;
    return NextResponse.json({ hasEcryptedKey }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
