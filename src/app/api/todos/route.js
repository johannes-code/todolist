// src/app/api/todos/route.js
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { connectToDB } from "@/app/lib/db";
import Todo from "@/models/Todo";
import { getInternalUserId } from "@/app/lib/user-mapping";

async function getUserIdFromRequest() {
  const headersList = headers();

  console.log("Headers available:", {
    hasAuthStatus: headersList.has("authStatus"),
    authStatus: headersList.get("authStatus"),
    authorization: headersList.get("authorization"),
  });

  const authUserId = headersList.get("x-user-id");
  if (authUserId) {
    console.log("Found user ID in headers:", authUserId);
    return authUserId;
  }

  const authHeader = headersList.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const [, payload] = token.split(".");
      const decodedPayload = JSON.parse(atob(payload));
      console.log("Decoded JWT payload:", { sub: decodedPayload.sub });
      return decodedPayload.sub;
    } catch (error) {
      console.error("Failed to decode JWT:", error);
    }
  }

  console.log("No user ID found in request");
  return null;
}

export async function GET(request) {
  try {
    console.log("GET /api/todos called");

    const clerkId = await getUserIdFromRequest();

    if (!clerkId) {
      console.error("No authenticated user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      "Authenticated with Clerk ID:",
      clerkId.substring(0, 8) + "..."
    );

    try {
      await connectToDB();
      console.log("Database connected");
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { error: "Database connection failed", details: dbError.message },
        { status: 500 }
      );
    }

    const internalUserId = await getInternalUserId(clerkId);

    if (!internalUserId) {
      console.log("User mapping not found, returning empty array");
      return NextResponse.json([]);
    }

    console.log("Internal user ID:", internalUserId);

    const todos = await Todo.find({ userId: internalUserId }).sort({
      createdAt: -1,
    });
    console.log("Found todos:", todos.length);

    return NextResponse.json(todos);
  } catch (error) {
    console.error("Unexpected error in GET /api/todos:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log("POST /api/todos called");

    const clerkId = await getUserIdFromRequest();

    if (!clerkId) {
      console.error("No authenticated user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      "Authenticated with Clerk ID:",
      clerkId.substring(0, 8) + "..."
    );

    await connectToDB();

    const requestBody = await request.json();
    console.log("Request body keys:", Object.keys(requestBody));

    const encryptedTodo = requestBody.encryptedTodo || requestBody;

    if (!encryptedTodo?.iv) {
      return NextResponse.json(
        { error: "Missing encryption IV" },
        { status: 400 }
      );
    }

    const todoData = encryptedTodo.encryptedData || encryptedTodo.data;
    if (!todoData) {
      return NextResponse.json(
        { error: "Missing encrypted data" },
        { status: 400 }
      );
    }

    let internalUserId = await getInternalUserId(clerkId);

    if (!internalUserId) {
      console.log("Creating new user mapping");
      internalUserId = await getInternalUserId(clerkId, {
        createdAt: new Date(),
      });
    }

    if (!internalUserId) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    console.log("Internal user ID:", internalUserId);

    const newTodo = new Todo({
      userId: internalUserId,
      iv: encryptedTodo.iv,
      data: todoData,
      createdAt: new Date(),
    });

    await newTodo.save();
    console.log("Created new todo:", newTodo._id);

    return NextResponse.json(newTodo);
  } catch (error) {
    console.error("Unexpected error in POST /api/todos:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
