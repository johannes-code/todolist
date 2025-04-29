// api/todos/route.js

import Todo from "@/models/Todo";
import { connectToDB } from "../../lib/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import UserProfile from "@/models/UserProfile"; // Import your User Profile model

async function getUserByClerkId(clerkId) {
  await connectToDB();
  return await UserProfile.findOne({ userId: clerkId }).lean();
}

export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found in our database. Please sign up." },
        { status: 404 }
      );
    }

    await connectToDB(); // Ensure connection after user check
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

export async function POST(request) {
  try {
    await connectToDB(); // Connect at the beginning

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found in our database. Please sign up." },
        { status: 404 }
      );
    }

    const { ciphertext, iv, priority } = await request.json();

    const newTodo = await Todo.create({
      ciphertext: Buffer.from(ciphertext, "base64"),
      iv: Buffer.from(iv, "base64"),
      userId,
      priority,
    });

    return NextResponse.json(JSON.parse(JSON.stringify(newTodo)), {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json(
      { error: "Failed to create todo" },
      { status: 500 }
    );
  }
}
