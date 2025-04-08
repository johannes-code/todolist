'use client';

import { useState, useEffect } from 'react';
import AddTodoForm from '@/components/AddTodoForm';
import TodoItem from '@/components/TodoItem';
import requireAuth from "@clerk/nextjs";
import Link from "next/link"; 

function TodoListComponent() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userId } = requireAuth();

  useEffect(() => {
    async function loadTodos() {
      setLoading(true);
      try {
        const response = await fetch('/api/todos'); // Fetch from your API route
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTodos(data);
      } catch (error) {
        console.error("Error loading todos:", error);
        // Handle error appropriately
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      loadTodos();
    } else {
      console.log("User not authenticated (inside TodoList)");
      setTodos([]);
      setLoading(false);
    }
  }, [userId]);

  if (loading) {
    return <div>Loading todos...</div>;
  }

  return (
    <>
      <AddTodoForm />
      <div className="mt-6 space-y-2">
        {todos.map((todo, index) => (
          <TodoItem key={index} todo={todo} />
        ))}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6">Todo App</h1>
      <requireAuth fallback= {<>
        <p>Please <Link href="/sign-in">sign in</Link></p>
        <p>To get your own user <Link href="/sign-up">sign up</Link> here</p>
      </>}>
        <TodoListComponent />
      </requireAuth>
    </div>
  );
}