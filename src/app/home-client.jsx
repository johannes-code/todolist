"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [encryptionKeyInitialized, setEncryptionKeyInitialized] =
    useState(false);
  const [isKdkGenerationInitiated, setIsKdkGenerationInitiated] =
    useState(false);
  const [isFetchingTodos, setIsFetchingTodos] = useState(false);

  const isFullyReady = userLoaded;
  const isAuthenticated = isSignedIn && !!user?.id;
  const userId = user?.id;

  const fetchWithAuth = async (url, options = {}) => {
    const token = await getAuthToken();

    if (!token) throw new Error("No authentication token available");
    const headers = {
      ...options?.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const method = options.method || "GET";

    const response = await fetch(url, {
      method: method,
      headers: headers,
      body: options.body || null,
    });

    console.log("Request to:", url, "with token:", token?.slice(0, 10));
    console.log("Response:", response);

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (_) {
        // Ignore JSON parsing errors
      }
      throw new Error(errorMessage);
    }

    return response;
  };

  const fetchTodos = useCallback(async () => {
    if (!isSignedIn || !userId || isFetchingTodos) return;

    setIsFetchingTodos(true);
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching todos for user:", userId);
      const response = await fetchWithAuth(`/api/todos`);
      const data = await response.json();
      console.log(`Retrieved ${data.length} todos from database`);
      setTodos(data);
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
      setIsFetchingTodos(false);
    }
  }, [isSignedIn, userId, isFetchingTodos]);

  const initializeEncryptionKey = useCallback(async () => {
    if (
      !isAuthenticated ||
      encryptionKeyInitialized ||
      !userId ||
      isKdkGenerationInitiated
    )
      return;

    setIsKdkGenerationInitiated(true);
    console.log("KDK generation initiated. triggering generation...");

    try {
      const profileRes = await fetchWithAuth(`/api/user-profile/${userId}`);
      const profileData = await profileRes.json();
      console.log("Profile Data from API:", profileData);

      const {
        kdk: kdkBase64,
        kdkSalt: kdkSaltBase64,
        hasEncryptedKey,
      } = profileData;

      if (kdkSaltBase64 && hasEncryptedKey) {
        const kdkSaltBytes = Buffer.from(kdkSaltBase64, "base64");
        const userIdBytes = new TextEncoder().encode(userId); // Using userId as secret for now

        try {
          // 1. Import the user's secret (userId for now) as a CryptoKey
          const baseKey = await window.crypto.subtle.importKey(
            "raw",
            userIdBytes,
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
          );

          // 2. Derive the encryption key using the imported base key and the salt
          const derivedKey = await window.crypto.subtle.deriveKey(
            {
              name: "PBKDF2",
              salt: kdkSaltBytes,
              iterations: 100000,
              hash: "SHA-256",
            },
            baseKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
          );

          setDerivedEncryptionKey(derivedKey);
          setEncryptionKeyInitialized(true);
          console.log(
            "Encryption key derived successfully using Web Crypto API."
          );

          // Now that we have the key, fetch todos if none exist yet
          if (todos.length === 0) {
            await fetchTodos();
          }

          return derivedKey;
        } catch (error) {
          console.error("Web Crypto API key derivation error:", error);
          setError("Failed to initialize encryption key.");
          setIsKdkGenerationInitiated(false);
        }
      } else if (!hasEncryptedKey) {
        console.warn("KDK not yet generated. Triggering generation...");

        try {
          const kdkResponse = await fetchWithAuth("/api/kdk", {
            method: "POST",
          });
          if (kdkResponse.ok) {
            console.log("KDK generation triggered successfully.");
            setIsKdkGenerationInitiated(false); // Reset flag so we can try again
            await initializeEncryptionKey(); // Re-run to fetch profile with new KDK/salt
          } else {
            const errorData = await kdkResponse.json();
            console.error("Failed to trigger KDK generation:", errorData);
            setError("Failed to initialize encryption key.");
            setIsKdkGenerationInitiated(false);
          }
        } catch (generationError) {
          console.error("Error triggering KDK generation:", generationError);
          setError("Failed to initialize encryption key.");
          setIsKdkGenerationInitiated(false);
        }
      } else {
        console.log(
          "KDK and salt found, but hasEncryptedKey is false. This should ideally not happen."
        );
        setIsKdkGenerationInitiated(false);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to initialize encryption key.");
      setIsKdkGenerationInitiated(false);
    }
  }, [
    isAuthenticated,
    encryptionKeyInitialized,
    userId,
    isKdkGenerationInitiated,
    todos.length,
    fetchTodos,
  ]);

  const decryptAllTodos = useCallback(async () => {
    console.log(
      "decryptAllTodos called with todos:",
      todos.length,
      "and key available:",
      Boolean(derivedEncryptionKey)
    );

    if (!derivedEncryptionKey || todos.length === 0) {
      console.log("No todos to decrypt or key not available.");
      setDecryptedTodos([]);
      return;
    }

    try {
      const decryptedData = await Promise.all(
        todos.map(async (todo) => {
          // Extract the base64 strings correctly from MongoDB format
          const currentIv =
            todo.iv && todo.iv.$binary ? todo.iv.$binary.base64 : todo.iv;

          const currentCiphertext =
            todo.ciphertext && todo.ciphertext.$binary
              ? todo.ciphertext.$binary.base64
              : todo.ciphertext;

          console.log(
            "Attempting to decrypt todo:",
            todo._id,
            "iv:",
            currentIv
          );

          if (currentCiphertext && currentIv) {
            try {
              const decryptedText = await decryptData(
                derivedEncryptionKey,
                currentIv,
                Buffer.from(currentCiphertext, "base64").buffer
              );
              console.log("Successfully decrypted todo:", todo._id);
              return { ...todo, text: decryptedText };
            } catch (error) {
              console.error("Decryption error for:", todo._id, ":", error);
              return { ...todo, text: "[Error decrypting]" };
            }
          } else {
            console.warn("Missing ciphertext or IV for todo:", todo._id);
            return { ...todo, text: "[Cannot decrypt - missing data]" };
          }
        })
      );

      console.log("All todos decrypted successfully:", decryptedData.length);
      setDecryptedTodos(decryptedData);
    } catch (err) {
      console.error("Error during bulk decryption:", err);
    }
  }, [todos, derivedEncryptionKey]);

  // Initial setup effect - runs once when component is ready
  useEffect(() => {
    console.log("Auth debug:", {
      clerkLoaded,
      userLoaded,
      isSignedIn,
      userId,
      time: new Date().toISOString(),
    });

    if (!isFullyReady) {
      console.log("Clerk still initializing");
      return;
    }

    if (isAuthenticated) {
      // If authenticated but key not initialized, initialize it
      if (!encryptionKeyInitialized) {
        console.log("User is fully authenticated. Initializing key...", userId);
        initializeEncryptionKey();
      } else {
        console.log("Encryption key is initialized. Fetching todos.");
        fetchTodos();
      }
    } else {
      console.log("User is not authenticated - clearing data");
      setTodos([]);
      setDecryptedTodos([]);
      setLoading(false);
      setEncryptionKeyInitialized(false);
      setDerivedEncryptionKey(null);
      setIsKdkGenerationInitiated(false);
    }
  }, [
    isFullyReady,
    isAuthenticated,
    userId,
    encryptionKeyInitialized,
    initializeEncryptionKey,
    fetchTodos,
  ]);

  // Effect to decrypt todos when either todos or key changes
  useEffect(() => {
    if (todos.length > 0 && derivedEncryptionKey) {
      decryptAllTodos();
    }
  }, [todos, derivedEncryptionKey, decryptAllTodos]);

  // Handle todo addition
  const handleTodoAdded = useCallback(() => {
    fetchTodos();
  }, [fetchTodos]);

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
              <AddTodoForm
                encryptionKey={derivedEncryptionKey}
                onTodoAdded={handleTodoAdded}
              />
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
