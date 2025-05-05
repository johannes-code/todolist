//api/todos/[id]/route.js

import { connectToDB } from "../../../lib/db";
import Todo from "@/models/Todo";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import UserProfile from "@/models/UserProfile";

async function getUserByClerkId(clerkId) {
  await connectToDB();
  return await UserProfile.findOne({ userId: clerkId }).lean();
}

export async function PUT(request, { params }) {
  const { id } = await params;
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
  const { completed, priority } = await request.json();

  const updateFields = {};
  if (completed !== undefined) {
    updateFields.completed = completed;
  }
  if (priority !== undefined) {
    updateFields.priority = priority;
  }

  const updatedTodo = await Todo.findOneAndUpdate(
    { _id: id, userId },
    updateFields,
    { new: true }
  ).lean();

  if (!updatedTodo) {
    return NextResponse.json(
      { error: "Todo not found or unauthorized" },
      { status: 404 }
    );
  }

  return NextResponse.json(updatedTodo);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
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
  const deletedTodo = await Todo.findOneAndDelete({ _id: id, userId });

  if (!deletedTodo) {
    return NextResponse.json(
      { error: "Todo not found, or Unauthorized" },
      { status: 404 }
    );
  }

  return NextResponse.json(deletedTodo);
}
