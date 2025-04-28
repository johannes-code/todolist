// api/user-profile/[userId]/route.js

import Todo from "@/models/Todo";
import { connectToDB } from "@/app/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request, { params }) {
  // Receive params as an argument
  try {
    await connectToDB();
    // Await the params object to ensure it's fully resolved
    const requestedUserId = await Promise.resolve(params.userId);

    if (!requestedUserId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    const { userId } = await auth();

    if (!userId || userId !== requestedUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todos = await Todo.find({ userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(todos);
  } catch (error) {
    console.error("API error details:", error);
    return NextResponse.json(
      { error: "Failed to fetch todos" },
      { status: 500 }
    );
  }
}
