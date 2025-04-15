"use client";

import { useState, useEffect } from "react";
import AddTodoForm from "@/components/AddTodoForm";
import TodoItem from "@/components/TodoItem";
import { useAuth } from "@clerk/nextjs"; // Import useAuth
import Link from "next/link";
import {
  generateEncryptionKey,
  exportKey,
  encryptData,
} from "@/utils/encryptionUtils";

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
    async function initializeEncryptionKey() {
      if (isSignedIn && userId) {
        const userProfileResponse = await fetch(`/api/user/${userId}`, {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
        const userProfileData = await userProfileResponse.json();

        if (!userProfileData.encryptedKey) {
          const newEncryptionKey = await generateEncryptionKey();
          const exportedKey = await exportKey(newEncryptionKey);

          const keyStoreagePayload = {
            userId: userId,
            exportKey: JSON.stringify(exportedKey),
          };

          const storeKeyResponse = await fetch("/api/store-encrytion-key", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify(keyStoreagePayload),
          });
          if (!storeKeyResponse.ok) {
            console.error("Failed to store encryption key:", storeKeyResponse);
          } else {
            console.log("Encryption key stored successfully.");
          }
        } else {
          console.log("Encryption key allready exists for this user.");
        }
      }
    }

    if (isSignedIn) {
      fetchTodos(sessionToken);
      initializeEncryptionKey(); // Call fetchTodos with the sessionToken
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
