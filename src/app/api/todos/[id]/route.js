import { NextResponse } from "next/server";
import { connectToDB } from "@/app/lib/db";
import Todo from "@/models/Todo";
import { auth } from "@clerk/nextjs/server";
import { hashUserIdToHex } from "@/app/lib/crypto-utils";

export async function DELETE(req, { params }) {
  try {
    log("DELETE /api/todos/[id] called");

    const { userId } = await auth();

    if (!userId) {
      error("No authenticated user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    log("Deleting todo with ID:", id);

    const userIdHash = await hashUserIdToHex(userId);
    await connectToDB();

    const result = await Todo.deleteOne({
      _id: id,
      userIdHash,
    });

    if (result.deletedCount === 0) {
      error("Todo not found or unauthorized");
      return NextResponse.json(
        { error: "Todo not found or unauthorized" },
        { status: 404 }
      );
    }

    log("Todo deleted successfully");
    return NextResponse.json({ message: "Todo deleted successfully" });
  } catch (error) {
    error("Unexpected error in DELETE /api/todos/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    log("PUT /api/todos/[id] called");

    const { userId } = await auth();

    if (!userId) {
      error("No authenticated user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    log("Request body:", body);

    const { iv, encryptedData } = body;

    if (!iv || !encryptedData) {
      return NextResponse.json(
        { error: "Invalid request body -  missing encrypted data" },
        { status: 400 }
      );
    }
    log("Updating todo with ID: ", id);

    const userIdHash = await hashUserIdToHex(userId);
    await connectToDB();

    const result = await Todo.findOneAndUpdate(
      { _id: id, userIdHash },
      {
        $set: {
          iv: iv,
          data: encryptedData,
          updatedAT: new Date(),
        },
      },
      { new: true }
    );

    if (!result) {
      logError("Todo not found or unauthorized");
      return NextResponse.json(
        { error: "Todo not found or unauthorized" },
        { status: 404 }
      );
    }

    log("Todo updated successfully");
    return NextResponse.json({
      message: "Todo updated successfully",
      todo: {
        id: result._id,
        userId: userId,
        iv: result.iv,
        encryptedData: result.data,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    });
  } catch (error) {
    logError("Error updating todo:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
