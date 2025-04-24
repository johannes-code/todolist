"use client";

import { useState, useEffect } from "react";
import AddTodoForm from "@/components/AddTodoForm.jsx";
import TodoItem from "@/components/TodoItem";
import { useSession, useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  generateEncryptionKey,
  exportKey,
  importKey,
} from "@/app/utils/encryptionUtils";
import { getAuthToken } from "@/app/utils/authUtils";

export default function TodoListComponent() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { session, isSignedIn, userId } = useSession();
  const { user } = useUser();
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [error, setError] = useState(null);

  // Updated fetchWithAuth to use the getAuthToken utility
  const fetchWithAuth = async (url, options = {}) => {
    if (!isSignedIn || !session) {
      const authError = new Error(
        "Bruker ikke logget inn eller sesjon ikke klar."
      );
      authError.statusCode = 401;
      throw authError;
    }

    // Use the utility function instead of directly calling session.getToken()
    const sessionToken = await getAuthToken(session);

    if (!sessionToken) {
      throw new Error("Kunne ikke hente autentiseringstoken.");
    }

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const backendError = new Error(
        `Backend feil: ${response.status} ${response.statusText} - ${errorText}`
      );
      backendError.statusCode = response.status;
      throw backendError;
    }

    return response;
  };

  async function fetchTodos() {
    setLoading(true);
    setError(null);

    if (!isSignedIn || !session) {
      setTodos([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithAuth("/api/todos");
      const data = await response.json();
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
    }
  }

  async function initializeEncryptionKey() {
    if (!isSignedIn || !session || !userId) {
      console.log(
        "Skipping key initialization: Not signed in, session not ready, or user ID missing."
      );
      return;
    }
    setError(null);

    try {
      const userProfileResponse = await fetchWithAuth(
        `/api/user-profile/${userId}`
      );
      const userProfileData = await userProfileResponse.json();

      if (!userProfileData.hasEncryptedKey) {
        const newEncryptionKey = await generateEncryptionKey();
        console.log("New encryption key generated:", newEncryptionKey);

        const exportedKey = await exportKey(newEncryptionKey);

        const keyStoragePayload = {
          userId: userId,
          exportedKey: Array.from(new Uint8Array(exportedKey)),
        };

        const storeKeyResponse = await fetchWithAuth(
          "/api/store-encryption-key",
          {
            method: "POST",
            body: JSON.stringify(keyStoragePayload),
          }
        );

        if (storeKeyResponse.ok) {
          console.log("Encryption key generated and stored.");
          setEncryptionKey(newEncryptionKey);
        }
      } else {
        console.log("Encryption key already exists for this user.");
        const userProfileResponseWithKey = await fetchWithAuth(
          `/api/user-profile/${userId}`
        );
        const userProfileDataWithKey = await userProfileResponseWithKey.json();

        if (userProfileDataWithKey && userProfileDataWithKey.encryptedKey) {
          try {
            const keyArrayBuffer = new Uint8Array(
              userProfileDataWithKey.encryptedKey
            ).buffer;
            const importedKey = await importKey(keyArrayBuffer);
            setEncryptionKey(importedKey);
          } catch (error) {
            console.error("Error importing existing key:", error);
            setError(
              `Feil ved import av nøkkel: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        } else {
          console.error("User profile data or encryptedKey missing.");
          setError("Kunne ikke hente krypteringsnøkkel fra profil.");
        }
      }
    } catch (error) {
      console.error("Error during key initialization:", error);
      setError(
        `Feil under nøkkelinitialisering: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  useEffect(() => {
    console.log("Effect running...");
    console.log("Is Signed In:", isSignedIn);
    console.log("Session Ready:", session != null);

    if (isSignedIn && session) {
      console.log("User is signed in and session is ready. Fetching data...");
      fetchTodos();
      initializeEncryptionKey();
    } else if (!isSignedIn) {
      console.log("User not signed in. Clearing data.");
      setTodos([]);
      setLoading(false);
      setEncryptionKey(null);
      setError(null);
    }
  }, [userId, isSignedIn, session]);

  if (loading) {
    return <div>Laster todos...</div>;
  }

  if (error) {
    return <div className="text-red-500">Det oppstod en feil: {error}</div>;
  }

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
              {todos.length === 0 && !loading && !error && (
                <p className="text-gray-400">
                  Ingen todos funnet. Legg til noen!
                </p>
              )}
              {todos.map((todo, index) => (
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
