// src/app/api/todos/route.js
import { NextResponse } from "next/server";
import { connectToDB } from "@/app/lib/db";
import Todo from "@/models/Todo";
import { auth } from "@clerk/nextjs/server";

export async function GET(request) {
  try {
    console.log("GET /api/todos called");

    // Get authentication
    const { userId } = await auth();

    if (!userId) {
      console.error("No authenticated user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Authenticated with Clerk ID:", userId.substring(0, 8) + "...");

    await connectToDB();
    console.log("Database connected");

    const todos = await Todo.find({ userId }).sort({
      createdAt: -1,
    });
    console.log("Found todos:", todos.length);

    // Debug: log raw todo structure
    if (todos.length > 0) {
      console.log(
        "Sample todo structure:",
        JSON.stringify(todos[0].toObject(), null, 2)
      );
    }

    const formattedTodos = todos.map((todo) => {
      const todoObj = todo.toObject();

      if (!todoObj.data && !todoObj.encryptedData) {
        console.error("Todo missing encrypted data:", todoObj);
        return null;
      }

      return {
        _id: todoObj._id,
        userId: todoObj.userId,
        iv: todoObj.iv,
        encryptedData: todoObj.data || todoObj.encryptedData,
        createdAt: todoObj.createdAt,
      };
    });

    const validTodos = formattedTodos.filter(Boolean);
    console.log(
      "Formatted todo example:",
      JSON.stringify(validTodos[0], null, 2)
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

    // Get authentication
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

    const { todo } = body;
    console.log("Todo object:", JSON.stringify(todo));

    if (!todo || !todo.iv || !todo.encryptedData) {
      console.log("Validation failed - missing properties");
      return NextResponse.json(
        { error: "Invalid todo data" },
        {
          status: 400,
        }
      );
    }

    await connectToDB();
    console.log("Database connected");

    const newTodo = new Todo({
      userId,
      iv: todo.iv,
      data: todo.encryptedData,
      createdAt: new Date(),
    });

    console.log("Creating new todo...");
    const savedTodo = await newTodo.save();
    console.log("Todo saved with ID:", savedTodo._id);

    return NextResponse.json(
      {
        _id: savedTodo._id.toString(),
        userId: savedTodo.userId,
        iv: savedTodo.iv,
        data: savedTodo.data,
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
