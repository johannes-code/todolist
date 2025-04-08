export const dynamic = 'force-dynamic';

import { connectToDB } from "./lib/db";
import Todo from "@/models/Todo.jsx";
import TodoItem from "@/components/TodoItem";
import AddTodoForm from "@/components/AddTodoForm";
import { auth } from "@clerk/nextjs/server";
import { requireAuth } from "@clerk/nextjs"
import Link from "next/link";

export default async function Home() {
  const { userId } = auth(); // Get authenticated user ID

  await connectToDB();

  let todos = [];
  if (userId) {
    todos = await Todo.find({ userId }).sort({ createdAt: -1 }).lean();
  } else {
    console.log("User not authenticated"); // Log unauthenticated state
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6">Todo App</h1>
        <requireAuth fallback= {<>
        
          <p>Please <Link href="/sign-in">sign in</Link></p>
          <p>To get your own user <Link href="/sign-up">sign up</Link> here</p>
        </>}>
      
        <>
          <AddTodoForm />
          <div className="mt-6 space-y-2">
            {todos.map((todo, index) => (
              <TodoItem key={index} todo={{ ...todo, _id: todo._id.toString() }} />
            ))}
          </div>
        </>
      </requireAuth>
    </div>
  );
}
