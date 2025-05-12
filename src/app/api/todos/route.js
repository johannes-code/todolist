// src/app/api/todos/route.js
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { connectToDB } from "@/app/lib/db";
import Todo from "@/models/Todo";
import { getInternalUserId } from "@/app/lib/user-mapping";
import { auth } from "@clerk/nextjs/server";

async function getUserIdFromRequest() {
  const headersList = await headers();

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

export async function POST(req) {
  try {
    console.log("POST /api/todos called");

    // Get authentication using the modern auth() function
    const { userId } = await auth();
    console.log("Clerk userId:", userId);

    if (!userId) {
      console.log("No authenticated user");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log("Received body:", JSON.stringify(body));

    const { todo } = body;
    console.log("Todo object:", JSON.stringify(todo));

    if (!todo || !todo.iv || !todo.encryptedData) {
      console.log("Validation failed - missing properties");
      return new Response(JSON.stringify({ error: "Invalid todo data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Debug what connectToDB returns
    const dbResult = await connectToDB();
    console.log("connectToDB result type:", typeof dbResult);
    console.log("connectToDB result keys:", Object.keys(dbResult || {}));
    console.log("Is it a Mongoose connection?", dbResult?.constructor?.name);
    console.log("Does it have .db method?", typeof dbResult?.db);
    console.log("Does it have .database property?", dbResult?.database);
    console.log("Does it have .client property?", dbResult?.client);

    // Try different ways to get the collection
    let todosCollection;

    // If it's a MongoDB client with a database
    if (dbResult?.db) {
      const database = dbResult.db("your-database-name"); // Replace with your actual database name
      todosCollection = database.collection("todos");
    }
    // If it's already a database
    else if (dbResult?.collection) {
      todosCollection = dbResult.collection("todos");
    }
    // If it's a Mongoose connection
    else if (dbResult?.models) {
      // For Mongoose, you'd need to use a model
      return new Response(
        JSON.stringify({
          error:
            "This appears to be a Mongoose connection. Please use a Todo model instead.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      throw new Error(
        `Unknown database connection type: ${
          dbResult?.constructor?.name || typeof dbResult
        }`
      );
    }

    const newTodo = {
      userId,
      todo: {
        iv: todo.iv,
        encryptedData: todo.encryptedData,
      },
      completed: false,
      createdAt: new Date(),
    };

    console.log("Inserting new todo:", JSON.stringify(newTodo));
    const result = await todosCollection.insertOne(newTodo);

    return new Response(
      JSON.stringify({
        id: result.insertedId.toString(),
        ...newTodo,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in POST /api/todos:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
