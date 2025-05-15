"use client";
import { useState, useEffect } from "react";
import AddTodoForm from "@/components/AddTodoForm";
import TodoItem from "@/components/TodoItem";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  deriveKeyFromUserId,
  encryptData,
  decryptData,
} from "./lib/crypto-utils";
import { log, logError } from "@/app/utils/logger";

function TodoListComponent() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [keyInitialized, setKeyInitialized] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [initError, setInitError] = useState(null);
  const { isSignedIn, getToken, userId } = useAuth();

  // Key Initialization
  useEffect(() => {
    let mounted = true;

    async function initializeKey() {
      try {
        if (!isSignedIn || !userId) {
          log("Not signed in or no user ID, skipping key initialization");
          return;
        }

        log("Initializing encryption key for user:", userId);

        // Derive a consistent key from the user ID
        const key = await deriveKeyFromUserId(userId);

        if (mounted) {
          setEncryptionKey(key);
          setKeyInitialized(true);
          log("Key initialized successfully");
        }
      } catch (error) {
        logError("Key initialization failed:", error);
        if (mounted) {
          setInitError("Failed to initialize encryption");
          setKeyInitialized(true);
        }
      }
    }

    initializeKey();

    return () => {
      mounted = false;
    };
  }, [isSignedIn, userId]);

  // Todo Fetching
  useEffect(() => {
    let mounted = true;

    async function fetchTodos() {
      try {
        if (!isSignedIn || !encryptionKey) {
          if (mounted) setTodos([]);
          return;
        }

        setLoading(true);

        // Get fresh token for the request
        const token = await getToken();
        log("Using token for fetch:", !!token);

        const response = await fetch("/api/todos", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;

          try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            logError("Could not parse error response:", e);
          }

          throw new Error(errorMessage);
        }

        const encryptedTodos = await response.json();
        log("Received todos:", encryptedTodos.length);
        log("First todo raw:", JSON.stringify(encryptedTodos[0], null, 2));

        const decryptedTodos = await Promise.all(
          encryptedTodos.map(async (encryptedTodo) => {
            try {
              // The API now returns 'encryptedData' directly
              if (!encryptedTodo.iv || !encryptedTodo.encryptedData) {
                logError(
                  "Todo missing required encryption fields:",
                  encryptedTodo
                );
                return null;
              }

              const decrypted = await decryptData(encryptionKey, {
                iv: encryptedTodo.iv,
                data: encryptedTodo.encryptedData, // Pass as 'data' as the decrypt function expects
              });

              return {
                _id: encryptedTodo._id,
                ...decrypted,
                createdAt: encryptedTodo.createdAt,
              };
            } catch (error) {
              logError("Failed to decrypt todo:", error);
              logError("Problematic todo:", encryptedTodo);
              return null;
            }
          })
        );

        if (mounted) {
          setTodos(decryptedTodos.filter(Boolean));
        }
      } catch (error) {
        logError("Todo fetch failed:", error);
        if (mounted) setInitError("Failed to load todos: " + error.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchTodos();

    return () => {
      mounted = false;
    };
  }, [isSignedIn, encryptionKey, refreshKey, getToken]);

  if (!isSignedIn) {
    return (
      <div className="text-center space-y-2">
        <p>
          Please{" "}
          <Link href="/sign-in" className="text-blue-500 hover:underline">
            sign in
          </Link>
        </p>
        <p>
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-blue-500 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    );
  }

  const handleAddTodo = async () => {
    setRefreshKey(Date.now()); // Trigger refresh
  };

  const handleUpdateTodo = (todoId, updates) => {
    setTodos(
      todos.map((todo) =>
        todo._id === todoId ? { ...todo, ...updates } : todo
      )
    );
  };

  if (!keyInitialized) {
    return <div className="text-center py-4">Initializing encryption...</div>;
  }

  if (initError) {
    return (
      <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {initError}
      </div>
    );
  }

  return (
    <>
      <AddTodoForm encryptionKey={encryptionKey} onTodoAdded={handleAddTodo} />
      <div className="mt-6 space-y-2">
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : todos.length === 0 ? (
          <p className="text-center text-gray-500">
            No todos yet. Add one above!
          </p>
        ) : (
          todos.map((todo) => (
            <TodoItem
              key={todo._id}
              todo={todo}
              encryptionKey={encryptionKey}
              onUpdate={handleUpdateTodo}
            />
          ))
        )}
      </div>
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
