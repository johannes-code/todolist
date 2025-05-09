// app/api/todos/route.js
import { connectToDB } from "@/app/lib/db";
import Todo from "@/models/Todo";
import { getInternalUserId } from "@/app/lib/user-mapping";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { unauthorized } from "next/navigation";

export async function GET() {
  try {
    await connectToDB();
    const { userId: clerkId } = auth();
    

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Authenticated with Clerk ID", clerkId);

    // Get the internal user ID corresponding to this Clerk ID
    const internalUserId = await getInternalUserId(clerkId);
    
    if (!internalUserId) {
      console.error("User mapping not found for Clerk ID:", clerkId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    console.log("Mapped to internal user ID:", internalUserId);

    // Use the internal user ID to query todos
    const todos = await Todo.find({ userId: internalUserId }).sort({ createdAt: -1 });
    console.log(`Fouind ${todos.length} todos for user`);

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

    console.log("Request headers:", Object.fromEntries(request.headers.entries()));
    
    if (!clerkId) {
      console.error("unauthorized access attempt: No clerk id")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Authenticated with clerk id", clerkId);
    // Get the internal user ID corresponding to this Clerk ID
    const internalUserId = await getInternalUserId(clerkId);
    
    if (!internalUserId) {
      console.log("User mapping not found for clerk ID", clerkId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Mapped to internal user ID:", internalUserId);

    const requestBody = await request.json();
    console.log("Recieved requset body structure:", Objkect.keys(requestBody));

    const encryptedTodo = requestBody.encryptedTodo || requestBody;

    if (!encryptedTodo?.iv || !encryptedTodo?.encryptedData) {
      return NextResponse.json(
        { error: "Invalid encrypted todo format" },
        { status: 400 }
      );
    }

    const todoData = encryptedTodo.encryptedData || encryptedTodo.data;

    if(!todoData) {
      return NextResponse.json(
        { error: "Missing encrypted data"},
        { status: 400 }
      );
    }


    // Create a new todo using the internal user ID
    const newTodo = new Todo({
      userId: internalUserId,
      iv: encryptedTodo.iv,
      data: todoData,
      createdAt: new Date()
    });

    await newTodo.save();
    console.log(`Created new todo for internal user ${internalUserId}`);
    
    return NextResponse.json(newTodo);
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json(
      { error: "Failed to create todo " + error.message },
      { status: 500 }
    );
  }
}