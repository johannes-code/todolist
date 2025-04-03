import { connectToDB } from "../../../../lib/db";
import { Todo } from "@/models/Todo";
import { NextResponse } from "next/server";

export async function GET() {
  await connectToDV();
  const todos = await Todo.find().sort({ createAt: -1 });
  return NextResponse.json(todos);
}

export async function POST(request) {
  await connectToDB();
  const { text } = await request.json();

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const newTodo = await Todo.create({ text });
  return NextResponse.json(newTodo, { status: 201 });
}
