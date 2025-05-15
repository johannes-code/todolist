// src/app/home-client.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import AddTodoForm from "@/components/AddTodoForm";
import TodoList from "@/components/TodoList";
import { useAuth } from "@clerk/nextjs";
import { useEncryptionKey } from "@/app/hooks/useEncryptionKey";
import { useTodos } from "@/app/hooks/useTodos";

function TodoListComponent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { isSignedIn } = useAuth();
  const { encryptionKey, initialized, error } = useEncryptionKey();
  const {
    todos,
    loading,
    error: fetchError,
    setTodos,
  } = useTodos(encryptionKey, refreshKey);

  if (!isSignedIn) {
    return (
      <div className="text-center space-y-2">
        <p>
          Please{" "}
          <Link href="/sign-in" className="text-blue-500">
            sign in
          </Link>
        </p>
        <p>
          Don’t have an account?{" "}
          <Link href="/sign-up" className="text-blue-500">
            Sign up
          </Link>
        </p>
      </div>
    );
  }

  if (!initialized) return <div>Initializing encryption...</div>;
  if (error || fetchError) return <div>Error: {error || fetchError}</div>;

  const handleAddTodo = () => setRefreshKey(Date.now());

  const handleUpdateTodo = (todoId, updates) => {
    setTodos((prev) =>
      prev.map((todo) => (todo._id === todoId ? { ...todo, ...updates } : todo))
    );
  };

  return (
    <>
      <AddTodoForm encryptionKey={encryptionKey} onTodoAdded={handleAddTodo} />
      <TodoList
        todos={todos}
        loading={loading}
        encryptionKey={encryptionKey}
        onUpdate={handleUpdateTodo}
      />
    </>
  );
}

export default function Home() {
  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Todo App</h1>
      <TodoListComponent />
    </div>
  );
}
