"use client";

import { useState, useEffect } from "react";
import AddTodoForm from "@/components/AddTodoForm";
import TodoItem from "@/components/TodoItem";
import { useAuth } from "@clerk/nextjs"; // Import useAuth
import Link from "next/link";

function TodoListComponent() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userId, isSignedIn, sessionToken } = useAuth(); // Get sessionToken here

  useEffect(() => {
    async function fetchTodos(token) {
      setLoading(true);
      try {
        if (isSignedIn) {
          const response = await fetch("/api/todos");
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setTodos(data);
        } else {
          setTodos([]); // Clear todos if not signed in
        }
      } catch (error) {
        console.error("Error loading todos:", error);
        // Handle error appropriately
      } finally {
        setLoading(false);
      }
    }

    if (isSignedIn) {
      fetchTodos(sessionToken); // Call fetchTodos with the sessionToken
    } else {
      setTodos([]);
      setLoading(false);
    }
  }, [userId, isSignedIn, sessionToken]); // Add sessionToken to the dependency array

  if (loading) {
    return <div>Loading todos...</div>;
  }

  return (
    <>
      {isSignedIn ? (
        <>
          <AddTodoForm />
          <div className="mt-6 space-y-2">
            {todos.map((todo, index) => (
              <TodoItem key={index} todo={todo} />
            ))}
          </div>
        </>
      ) : (
        <>
          <p>
            Please{" "}
            <Link className="text-red-600" href="/sign-in">
              sign in
            </Link>
          </p>
          <p>
            To get your own user{" "}
            <Link className="text-red-600" href="/sign-up">
              sign up
            </Link>{" "}
            here
          </p>
        </>
      )}
    </>
  );
}

export default function Home() {
  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6">Todo App</h1>
      <TodoListComponent /> {/* Render the TodoListComponent directly */}
    </div>
  );
}
