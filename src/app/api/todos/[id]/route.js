import { NextResponse } from "next/server";
import { connectToDB } from "@/app/lib/db";
import Todo from "@/models/Todo";
import { auth } from "@clerk/nextjs/server";
import { hashUserIdToHex } from "@/app/lib/crypto-utils";

export async function DELETE(req, { params }) {
  try {
    console.log("DELETE /api/todos/[id] called");

    const { userId } = await auth();

    if (!userId) {
      console.error("No authenticated user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log("Deleting todo with ID:", id);

    const userIdHash = await hashUserIdToHex(userId);
    await connectToDB();

    const result = await Todo.deleteOne({
      _id: id,
      userIdHash,
    });

    if (result.deletedCount === 0) {
      console.error("Todo not found or unauthorized");
      return NextResponse.json(
        { error: "Todo not found or unauthorized" },
        { status: 404 }
      );
    }

    console.log("Todo deleted successfully");
    return NextResponse.json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/todos/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const { userId } = await auth();
  await connectToDB();
  const { completed, priority } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
