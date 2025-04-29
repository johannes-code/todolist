"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import AddTodoForm from "@/components/AddTodoForm.jsx";
import TodoItem from "@/components/TodoItem";
import Link from "next/link";
import {
  encryptData,
  decryptData,
  deriveEncryptionKey,
} from "@/app/utils/encryptionUtils";
import { getAuthToken } from "@/app/utils/authUtils";

const ENCRYPTION_SALT = new TextEncoder().encode("your- ثابت-encryption-salt"); // Use a consistent salt

export default function TodoListComponent() {
  const { isLoaded: clerkLoaded } = useClerk();
  const { isSignedIn, user, isLoaded: userLoaded } = useUser();

  const [todos, setTodos] = useState([]);
  const [decryptedTodos, setDecryptedTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [derivedEncryptionKey, setDerivedEncryptionKey] = useState(null);
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
    //!Feilmelding starter pga respons ikke ok
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

  const [isKdkGenerationInitiated, setIsKdkGenerationInitiated] =
    useState(false);

  async function initializeEncryptionKey() {
    if (!isAuthenticated) return;
    if (isKdkGenerationInitiated) return; // Prevent multiple triggers

    try {
      const profileRes = await fetchWithAuth(`/api/user-profile/${userId}`);
      const { kdk: kdkBase64, kdkSalt: kdkSaltBase64 } =
        await profileRes.json();

      if (kdkBase64 && kdkSaltBase64) {
        const kdk = Buffer.from(kdkBase64, "base64");
        const kdkSalt = Buffer.from(kdkSaltBase64, "base64");

        const derivedKey = await deriveEncryptionKey(
          kdk.buffer,
          ENCRYPTION_SALT
        );
        setDerivedEncryptionKey(derivedKey);
        console.log("Encryption key derived successfully:", derivedKey);
      } else {
        console.warn(
          "KDK and salt not found for user. Triggering generation..."
        );
        setIsKdkGenerationInitiated(true); // Set the flag
        try {
          const kdkResponse = await fetchWithAuth("/api/kdk", {
            method: "POST",
          });
          if (kdkResponse.ok) {
            console.log("KDK generation triggered successfully.");
            // Optionally, you can retry fetching the profile after a short delay
            setTimeout(initializeEncryptionKey, 1000);
          } else {
            const errorData = await kdkResponse.json();
            console.error("Failed to trigger KDK generation:", errorData);
            setError("Failed to initialize encryption key.");
          }
        } catch (generationError) {
          console.error("Error triggering KDK generation:", generationError);
          setError("Failed to initialize encryption key.");
        }
      }
    } catch (error) {
      console.error("Key derivation error:", error);
      setError("Failed to initialize encryption key.");
    }
  }

  async function decryptAllTodos() {
    if (derivedEncryptionKey && todos.length > 0) {
      const decryptedData = await Promise.all(
        todos.map(async (todo) => {
          const currentIv = todo.iv;
          const currentCiphertext = todo.ciphertext;

          if (currentCiphertext && currentIv) {
            try {
              const decryptedText = await decryptData(
                derivedEncryptionKey,
                currentIv,
                Buffer.from(currentCiphertext, "base64").buffer
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
      setDecryptedTodos([]);
      setLoading(false);
    }
  }, [isFullyReady, isAuthenticated, userId]);

  useEffect(() => {
    decryptAllTodos();
  }, [todos, derivedEncryptionKey]);

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
            {derivedEncryptionKey ? (
              <AddTodoForm encryptionKey={derivedEncryptionKey} />
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
