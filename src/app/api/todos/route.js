import Todo from "@/models/Todo";
import { connectToDB } from "../../lib/db";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    await connectToDB();

    const todos = await Todo.find().sort({ createdAt: -1 }).lean()
    return NextResponse.json(todos);
  
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch encrypted todos" },
      { error: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDB();
    
    const encryptedTodo = await request.json();

    if (!encryptedTodo?.iv || !encryptedTodo?.data) {
      return NextResponse.json(
        { error: "Text must be a non-empty string" },
        { status: 400 }
      );
    }


    const newTodo = await Todo.create({ 
      iv: encryptedTodo.iv,
      data: encryptedTodo.data,
      createdAt: new Date()
     });

    return NextResponse.json(
      { success: true, id: newTodo._id },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "Failed store enqrypted todo" },
      { status: 500 }
    );
  }
}
