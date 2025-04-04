import { connectToDB } from "./lib/db";
import Todo from "@/models/Todo.jsx";
import TodoItem from "@/components/TodoItem";
import AddTodoForm from "@/components/AddTodoForm";

export default async function Home() {
  await connectToDB();
  const todos = await Todo.find().sort({ createdAt: -1 }).lean();

  console.log("Todos from servercomponents", todos);

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Todo App</h1>
      <AddTodoForm />
      <div className="mt-6 space-y-2">
        {todos?.map((todo, index) => (
          <TodoItem key={index} todo={{ ...todo, _id: todo._id.toString() }} />
        ))}
      </div>
    </div>
  );
}
