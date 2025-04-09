import Todo from "@/models/Todo";
import { connectToDB } from "../../lib/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"

export async function GET() {
  try {
    await connectToDB();
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized"}, { status: 401 });
    }

    const todos = await Todo.find({ userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch todos" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDB();
    const { userId } = auth();
    const { text } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized"}, {status: 401 });
    }

    if (!text?.trim()) {
      // Better validation
      return NextResponse.json(
        { error: "Text must be a non-empty string" },
        { status: 400 }
      );
    }

    const newTodo = await Todo.create({ text, userId });
    return NextResponse.json(JSON.parse(JSON.stringify(newTodo)), {
      status: 201,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create todo" },
      { status: 500 }
    );
  }
}
