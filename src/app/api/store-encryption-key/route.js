import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { exportedKey } = await request.json();

    if (!exportedKey) {
      return NextResponse.json(
        { error: "Missing exportedKey" },
        { status: 400 }
      );
    }

    await connectToDB();
    const db = (await import("mongoose")).connection.db;
    const usersCollection = db.collection("users");

    await usersCollection.updateOne(
      { userId },
      { $set: { encryptedKey: exportedKey } },
      { upsert: true }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Store key error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
