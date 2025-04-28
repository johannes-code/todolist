// src/app/home-client.jsx

"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

import AddTodoForm from "@/components/AddTodoForm.jsx";
import TodoItem from "@/components/TodoItem";
import Link from "next/link";
import {
  generateEncryptionKey,
  exportKey,
  importKey,
  decryptData,
} from "@/app/utils/encryptionUtils";
import { getAuthToken } from "@/app/utils/authUtils";

export default function TodoListComponent() {
  const { isLoaded: clerkLoaded } = useClerk();
  const { isSignedIn, user, isLoaded: userLoaded } = useUser();

  const [todos, setTodos] = useState([]);
  const [decryptedTodos, setDecryptedTodos] = useState([]); // State for decrypted todos
  const [loading, setLoading] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [error, setError] = useState(null);

  const isFullyReady = userLoaded;
  const isAuthenticated = isSignedIn && !!user?.id;
  const userId = user?.id;

  const fetchWithAuth = async (url, options = {}) => {
    const token = await getAuthToken();
    if (!token) throw new Error("No authentication token available");
    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    const response = await fetch(url, { ...options, headers });
    console.log("Request to:", url, "with token:", token?.slice(0, 10));
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `Request failed with status ${response.status}`
      );
    }
    return response;
  };

  async function fetchTodos() {
    setLoading(true);
    setError(null);
    if (!isSignedIn) {
      setTodos([]);
      setLoading(false);
      return;
    }
    try {
      const response = await fetchWithAuth("/api/todos");
      const data = await response.json();
      setTodos(data);
      console.log(
        "Todos state set with:",
        data.map((t) => t.iv)
      );
    } catch (error) {
      console.error("Error loading todos:", error);
      setError(
        `Kunne ikke laste todos: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }

  async function initializeEncryptionKey() {
    if (!isAuthenticated) return;
    try {
      const profileRes = await fetchWithAuth(`/api/user-profile/${userId}`);
      const { hasEncryptedKey } = await profileRes.json();
      if (!hasEncryptedKey) {
        const newKey = await generateEncryptionKey();
        const exportedKey = await exportKey(newKey);
        const keyBytes = Array.from(new Uint8Array(exportedKey));
        await fetchWithAuth("/api/store-encryption-key", {
          method: "POST",
          body: JSON.stringify({ exportedKey: keyBytes }),
        });
        setEncryptionKey(newKey);
      }
    } catch (error) {
      console.error("Key init error:", error);
      setError("Failed to initialize encryption");
    }
  }

  async function decryptAllTodos() {
    console.log(
      "Decrypting todos with IVs:",
      todos.map((t) => t.iv)
    );

    if (encryptionKey && todos.length > 0) {
      const decryptedData = await Promise.all(
        todos.map(async (todo) => {
          const currentIv = todo.iv; // Explicitly get the iv here
          const currentCiphertext = todo.ciphertext; // Explicitly get ciphertext

          if (currentCiphertext && currentIv) {
            try {
              const ciphertextBytes = Uint8Array.from(
                Buffer.from(currentCiphertext, "base64")
              );
              const ivBytes = Uint8Array.from(Buffer.from(currentIv, "base64"));

              const decryptedText = await decryptData(
                encryptionKey,
                ciphertextBytes,
                ivBytes
              );
              return { ...todo, text: decryptedText };
            } catch (error) {
              console.error("Decryption error:", error);
              return { ...todo, text: "[Error decrypting]" };
            }
          } else {
            return { ...todo, text: "[Cannot decrypt]" };
          }
        })
      );
      setDecryptedTodos(decryptedData);
    } else {
      setDecryptedTodos([]);
    }
  }

  useEffect(() => {
    console.log("Auth debug:", {
      clerkLoaded,
      userLoaded,
      isSignedIn,
      userId,
      time: new Date().toISOString(),
    });
    if (!isFullyReady) console.log("Clerk still initializing");
    if (isAuthenticated) {
      console.log("User is fully authenticated.", userId);
      fetchTodos();
      initializeEncryptionKey();
    } else {
      console.log("User is not fully authenticated - clearing data");
      setTodos([]);
      setDecryptedTodos([]); // Clear decrypted todos as well
      setLoading(false);
    }
  }, [isFullyReady, isAuthenticated, userId]);

  useEffect(() => {
    decryptAllTodos();
  }, [todos, encryptionKey]);

  console.log("Auth status:", { isSignedIn, userId });

  if (loading) return <div>Laster todos...</div>;
  if (error)
    return <div className="text-red-500">Det oppstod en feil: {error}</div>;
  if (!isFullyReady) return <div className="text-yellow-500">Laster...</div>;

  return (
    <>
      <div className="container mx-auto p-4">
        {isSignedIn ? (
          <>
            <h1 className="text-4xl font-bold mb-6 text-white">
              Todo App{" "}
              {user
                ? `for ${
                    user.firstName || user.emailAddresses?.[0].emailAddress
                  }`
                : ""}
            </h1>
            {encryptionKey ? (
              <AddTodoForm encryptionKey={encryptionKey} />
            ) : (
              <p className="text-yellow-500">
                Initialiserer krypteringsnøkkel...
              </p>
            )}

            <div className="mt-6 space-y-2">
              {decryptedTodos.length === 0 && !loading && !error && (
                <p className="text-gray-400">
                  Ingen todos funnet. Legg til noen!
                </p>
              )}
              {decryptedTodos.map((todo, index) => (
                <TodoItem key={todo._id || index} todo={todo} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-white">
            <p className="mb-4">
              Vennligst{" "}
              <Link className="text-blue-400 hover:underline" href="/sign-in">
                logg inn
              </Link>
            </p>
            <p>
              Har du ikke bruker?{" "}
              <Link className="text-blue-400 hover:underline" href="/sign-up">
                Registrer deg
              </Link>{" "}
              her
            </p>
          </div>
        )}
      </div>
    </>
  );
}
