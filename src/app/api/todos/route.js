// app/api/todos/route.js
import { connectToDB } from "@/app/lib/db";
import Todo from "@/models/Todo";
import { getInternalUserId } from "@/lib/user-mapping";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";

export async function GET() {
  try {
    await connectToDB();
    const { userId: clerkId } = auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the internal user ID corresponding to this Clerk ID
    const internalUserId = await getInternalUserId(clerkId);
    
    if (!internalUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Use the internal user ID to query todos
    const todos = await Todo.find({ userId: internalUserId }).sort({ createdAt: -1 });
    
    return NextResponse.json(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    return NextResponse.json(
      { error: "Failed to fetch todos" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDB();
    const { userId: clerkId } = auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the internal user ID corresponding to this Clerk ID
    const internalUserId = await getInternalUserId(clerkId);
    
    if (!internalUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const requestBody = await request.json();
    const encryptedTodo = requestBody.encryptedTodo;

    if (!encryptedTodo?.iv || !encryptedTodo?.encryptedData) {
      return NextResponse.json(
        { error: "Invalid encrypted todo format" },
        { status: 400 }
      );
    }

    // Create a new todo using the internal user ID
    const newTodo = new Todo({
      userId: internalUserId,
      iv: encryptedTodo.iv,
      data: encryptedTodo.encryptedData,
      createdAt: new Date()
    });

    await newTodo.save();
    return NextResponse.json(newTodo);
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json(
      { error: "Failed to create todo" },
      { status: 500 }
    );
  }
}