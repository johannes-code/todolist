// src/app/api/todos/route.js
import { NextResponse } from "next/server";
import { connectToDB } from "@/app/lib/db";
import Todo from "@/models/Todo";
import { auth } from "@clerk/nextjs/server";
import { hashUserIdToHex } from "@/app/lib/crypto-utils";

export async function GET() {
  try {
    console.log("GET /api/todos called");

    const { userId } = await auth();

    if (!userId) {
      console.error("No authenticated user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Authenticated with Clerk ID:", userId.substring(0, 8) + "...");

    const userIdHash = await hashUserIdToHex(userId);

    await connectToDB();
    console.log("Database connected");

    const todos = await Todo.find({ userIdHash }).sort({
      createdAt: -1,
    });
    console.log("Found todos:", todos.length);

    const formattedTodos = todos.map((todo) => {
      const todoObj = todo.toObject();

      if (!todoObj.data || todoObj.data.length === 0) {
        console.error("Todo has empty or missing data:", {
          id: todoObj._id,
          dataLength: todoObj.data ? todoObj.data.length : "missing",
        });
        return null;
      }

      return {
        _id: todoObj._id,
        userId: userId,
        iv: todoObj.iv,
        encryptedData: todoObj.data,
        createdAt: todoObj.createdAt,
      };
    });

    const validTodos = formattedTodos.filter(Boolean);
    console.log(
      `Returning ${validTodos.length} valid todos out of ${todos.length} total`
    );

    return NextResponse.json(validTodos);
  } catch (error) {
    console.error("Unexpected error in GET /api/todos:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    console.log("POST /api/todos called");

    const { userId } = await auth();
    console.log("Clerk userId:", userId);

    if (!userId) {
      console.log("No authenticated user");
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();
    console.log("Received body:", JSON.stringify(body));

    const { todo, userIdHash } = body;
    console.log("Todo object:", JSON.stringify(todo));
    console.log("Received userIdHash:", userIdHash);

    if (!todo || !todo.iv || !todo.encryptedData || !userIdHash) {
      console.log("Validation failed - missing properties");
      return NextResponse.json(
        { error: "Invalid todo data" },
        {
          status: 400,
        }
      );
    }

    const expectedHash = await hashUserIdToHex(userId);
    if (userIdHash !== expectedHash) {
      console.error("User ID hash mismatch");
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 403,
        }
      );
    }

    await connectToDB();
    console.log("Database connected");

    const newTodo = new Todo({
      userIdHash,
      iv: todo.iv,
      data: todo.encryptedData,
      createdAt: new Date(),
    });

    console.log(
      "Creating new todo with data length:",
      todo.encryptedData.length
    );
    const savedTodo = await newTodo.save();
    console.log("Todo saved with ID:", savedTodo._id);
    console.log("Saved todo data length:", savedTodo.data.length);

    return NextResponse.json(
      {
        _id: savedTodo._id.toString(),
        userId: userId,
        iv: savedTodo.iv,
        encryptedData: savedTodo.data,
        createdAt: savedTodo.createdAt,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Error in POST /api/todos:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
