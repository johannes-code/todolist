"use client";

import { useState, useEffect } from "react";
import AddTodoForm from "@/components/AddTodoForm.jsx";
import TodoItem from "@/components/TodoItem";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  generateEncryptionKey,
  exportKey,
  importKey,
} from "@/app/utils/encryptionUtils";

export default function TodoListComponent() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userId, isSignedIn, sessionToken } = useAuth();
  const [encryptionKey, setEncryptionKey] = useState(null);

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
        setTodos([]);
      }
    } catch (error) {
      console.error("Error loading todos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function initializeEncryptionKey() {
    if (isSignedIn && userId) {
      const userProfileResponse = await fetch(`/api/user-profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const userProfileData = await userProfileResponse.json();

      if (!userProfileData.hasEncryptedKey) {
        const newEncryptionKey = await generateEncryptionKey();
        console.log("New encryption key generated:", newEncryptionKey);

        const exportedKey = await exportKey(newEncryptionKey);

        const keyStoragePayload = {
          userId: userId,
          exportedKey: Array.from(new Uint8Array(exportedKey)),
        };

        const storeKeyResponse = await fetch("/api/store-encryption-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify(keyStoragePayload),
        });

        if (!storeKeyResponse.ok) {
          console.error("Error storing encryption key:", storeKeyResponse);
        } else {
          console.log(
            "Encryption key generated and stored (insecurely for now)."
          );
          setEncryptionKey(newEncryptionKey);
        }
      } else {
        console.log(
          "Encryption key already exists for this user (retrieving and importing)."
        );
        // Fetch the user profile again to get the encryptedKey data
        const userProfileResponseWithKey = await fetch(
          `/api/user-profile/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${sessionToken}`,
            },
          }
        );
        const userProfileDataWithKey = await userProfileResponseWithKey.json();

        if (userProfileDataWithKey && userProfileDataWithKey.encryptedKey) {
          try {
            const importedKey = await importKey(
              userProfileDataWithKey.encryptedKey
            );
            setEncryptionKey(importedKey);
          } catch (error) {
            console.error("Error importing existing key:", error);
          }
        }
      }
    }
  }

  useEffect(() => {
    console.log("encrytionKEY:", encryptionKey);
    console.log("Session Token in TodoListComponent:", sessionToken);
    if (isSignedIn) {
      fetchTodos(sessionToken);
      initializeEncryptionKey();
    } else {
      setTodos([]);
      setLoading(false);
    }
  }, [userId, isSignedIn, sessionToken]);

  if (loading) {
    return <div>Loading todos...</div>;
  }

  return (
    <>
      {isSignedIn ? (
        <>
          <h1 className="text-4xl font-bold mb-6">Todo App</h1>
          {encryptionKey && (
            <AddTodoForm
              encryptionKey={encryptionKey}
              sessionToken={sessionToken}
            />
          )}
          {/* Conditionally render AddTodoForm */}
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
