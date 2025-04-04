import { connectToDB } from "./lib/db";
import Todo from "@/models/Todo.jsx";
import TodoItem from "@/components/TodoItem";
import AddTodoForm from "@/components/AddTodoForm";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = auth();

  await connectToDB();

  let todos = [];
  if (userId) {
  todos = await Todo.find({ userId }).sort({ createdAt: -1 }).lean();
  } else {
    auth()
    console.log("User not authenticated")
  }
  return (
    <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Todo App</h1>
        <p>Please sign in to see your todos.</p>
      </div>
    // <div className="max-w-md mx-auto p-4">
    //   <h1 className="text-2xl font-bold mb-6">Todo App</h1>
    //   <AddTodoForm />
    //   <div className="mt-6 space-y-2">
    //     {todos?.map((todo, index) => (
    //       <TodoItem key={index} todo={{ ...todo, _id: todo._id.toString() }} />
    //     ))}
        
    //   </div>
    // </div>
  );
}
