"use client";

import { useState, useEffect } from "react";
import AddTodoForm from "@/components/AddTodoForm";
import TodoItem from "@/components/TodoItem";
import { useAuth } from "@clerk/nextjs"; // Import useAuth
import Link from "next/link";
import { generateEncryptionKey, encryptData, decryptData, encryptWithSession, decryptWithSession } from "./lib/crypto-utils";

function TodoListComponent() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const { userId, isSignedIn, sessionToken } = useAuth(); // Get sessionToken here


  useEffect(() => {
    async function initializeKey() {
      try {
        const storedKey = localStorage.getItem('encryptedKey');

        if(storedKey) {
          const key = await decryptWithSession(JSON.parse(storedKey), sessionToken);
          setEncryptionKey(key);
        } else {
          const newKey = await generateEncryptionKey();
          const encryptedKey = await encryptWithSession(newKey, sessionToken);
          localStorage.setItem('encryptedKey', JSON.stringify(encryptedKey));
          setEncryptionKey(newKey);
        }
      } catch (error) {
        console.error("Key initialization failed", error);
      }      
    }

    if (isSignedIn && sessionToken) {
      initializeKey();
    } else {
      setEncryptionKey(null);
    }
  }, [isSignedIn, sessionToken]);


  useEffect(() => {
    async function fetchTodos() {
      setLoading(true);
      try {
        if (isSignedIn && encryptionKey) {
          const response = await fetch("/api/todos");
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const encryptedTodos = await response.json();

          const decryptedTodos = await Promise.all(
          encryptedTodos.map(async (encryptedTodo) => {
            try {
              return {
                _id: encryptedTodo._id, // Preserve the original ID
                ...(await decryptData(encryptionKey, {
                  iv: encryptedTodo.iv,
                  data: encryptedTodo.data
                })),
                createdAt: encryptedTodo.createdAt // Optional: Preserve server timestamp
              };
            } catch (decryptError) {
              console.error("Failed to decrypt todo:", decryptError);
              return null; // Or handle corrupted todos differently
            }
          })
        );

        // Filter out null/undefined results if decryption failed
        setTodos(decryptedTodos.filter(todo => todo !== null));
      } else {
        setTodos([]);
      }
    } catch (error) {
      console.error("Error loading todos:", error);
      // Optional: Set error state for UI feedback
    } finally {
      setLoading(false);
    }
  }

    fetchTodos();
  }, [userId, isSignedIn, encryptionKey]);

  const handleAddTodo = async (content) => {
    if (!encryptionKey) return;

    const encryptedTodo = await encryptData(encryptionKey, {
      content,
      createdAt: new Date().toISOString()
    });

    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(encryptedTodo)
    });

    setTodos([...todos, { content, createdAt: new Date().toISOString() }]);
  };

  if (loading) {
    return <div>Loading todos...</div>;
  }

  return (
    <>
      {isSignedIn ? (
        <>
          <AddTodoForm 
          encryptionKey={encryptionKey}
          onNewTodo={() => setRefreshKey(Date.now())}
          onAdd={handleAddTodo} />
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
