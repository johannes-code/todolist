import { connectToDB } from "../../../lib/db";
import Todo from "@/models/Todo";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"

export async function PUT(request, { params }) {
  const { id } = await params;
  const { userId } = auth()
  await connectToDB();
  const { completed } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized"}, {status: 401 })
  }

  const updatedTodo = await Todo.findByIdAndUpdate(
    {id: id, userId},
    { completed },
    { new: true }
  ).lean();

  if (!updatedTodo){
    return NextResponse.json({ error: "Todo not found or unauthorized" }, { status: 404 })
  }

  return NextResponse.json(updatedTodo);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await connectToDB();
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const deletedTodo = await Todo.findOneAndDelete({ _id: id, userId });

  if (!deletedTodo) {
    return NextResponse.json({ error: "Todo not found, or Unauthorized" }, { status: 404 });
  }

  return NextResponse.json(deletedTodo);
}
