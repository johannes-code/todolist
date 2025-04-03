import { connectToDB } from "../../../../../lib/db";
import { Todo } from "@/models/Todo";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  await connectToDB();
  const { completed } = await request.json();

  const updatedTodo = await Todo.findByIdAndUpdate(
    params.id,
    { completed },
    { new: true }
  );
  return NextResponse.json(updatedTodo);
}

export async function DELETE(request, { params }) {
  await connectToDB();
  const deletedTodo = await Todo.findByIdAndDelete(params.id);

  if (!deletedTodo) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  return NextResponse.json(deletedTodo);
}
