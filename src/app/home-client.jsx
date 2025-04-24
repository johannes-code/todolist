"use client";

import { useState, useEffect } from "react";
import AddTodoForm from "@/components/AddTodoForm.jsx";
import TodoItem from "@/components/TodoItem";
// Importer useSession i stedet for useAuth
import { useSession, useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  generateEncryptionKey,
  exportKey,
  importKey,
} from "@/app/utils/encryptionUtils";
// Fjerner import av TestAuth her hvis den ikke er nødvendig for selve funksjonaliteten
// import TestAuth from "@/components/TestAuth.jsx";

export default function TodoListComponent() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  // Bruk useSession for å få tak i session objektet
  const { session, isSignedIn, userId } = useSession(); // useSession gir også userId
  const { user } = useUser(); // useUser kan gi mer brukerinfo om nødvendig
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [error, setError] = (useState < string) | (null > null); // Legg til state for feil

  // Hjelpefunksjon for å hente token og inkludere i header (kan gjenbrukes)
  const fetchWithAuth = async (url, options = {}) => {
    if (!isSignedIn || !session) {
      // Kaster feil hvis ikke logget inn, API-kall skal ikke skje da
      const authError = new Error(
        "Bruker ikke logget inn eller sesjon ikke klar."
      );
      authError.statusCode = 401; // Legger til en statuskode for enkelhet
      throw authError;
    }
    const sessionToken = await session.getToken();
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

  // Oppdatert fetchTodos funksjon
  async function fetchTodos() {
    // Fjern 'token' parameter, hentes internt
    setLoading(true);
    setError(null); // Nullstill feil

    // Sjekk om logget inn før kall
    if (!isSignedIn || !session) {
      setTodos([]);
      setLoading(false);
      return;
    }

    try {
      // Bruk fetchWithAuth for å inkludere token automatisk
      const response = await fetchWithAuth("/api/todos"); // API-rute for å hente todos

      // fetchWithAuth kaster feil hvis !response.ok, så her vet vi at det gikk bra
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error("Error loading todos:", error);
      // Sett feilmelding i state
      setError(
        `Kunne ikke laste todos: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      setTodos([]); // Tøm liste ved feil
    } finally {
      setLoading(false);
    }
  }

  async function initializeEncryptionKey() {
    // Sjekk om logget inn før kall
    if (!isSignedIn || !session || !userId) {
      console.log(
        "Skipping key initialization: Not signed in, session not ready, or user ID missing."
      );
      return;
    }
    setError(null); // Nullstill feil

    try {
      // Bruk fetchWithAuth for /api/user-profile
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
          // Konverter ArrayBuffer til Array<number> for JSON-sending
          exportedKey: Array.from(new Uint8Array(exportedKey)),
        };

        // Bruk fetchWithAuth for /api/store-encryption-key
        const storeKeyResponse = await fetchWithAuth(
          "/api/store-encryption-key",
          {
            method: "POST",
            body: JSON.stringify(keyStoragePayload),
          }
        );

        if (storeKeyResponse.ok) {
          // Sjekk ok status her også, selv om fetchWithAuth kaster feil på !ok
          console.log("Encryption key generated and stored.");
          setEncryptionKey(newEncryptionKey);
        }
      } else {
        console.log("Encryption key already exists for this user.");
        // Hvis nøkkelen finnes, hent dataen for å importere den
        // Bruk fetchWithAuth igjen for /api/user-profile for å få nøkkeldataen
        const userProfileResponseWithKey = await fetchWithAuth(
          `/api/user-profile/${userId}`
        );
        const userProfileDataWithKey = await userProfileResponseWithKey.json();

        if (userProfileDataWithKey && userProfileDataWithKey.encryptedKey) {
          try {
            // Konverter Array<number> tilbake til Uint8Array for importKey
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
      // Sett feilmelding i state
      setError(
        `Feil under nøkkelinitialisering: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  // Effect hook for å hente todos og initialisere nøkkel
  useEffect(() => {
    console.log("Effect running...");
    console.log("Is Signed In:", isSignedIn);
    console.log("Session Ready:", session != null); // Sjekk om session objektet er tilgjengelig

    // Kjør operasjoner KUN hvis brukeren er logget inn OG session objektet er klart
    if (isSignedIn && session) {
      console.log("User is signed in and session is ready. Fetching data...");
      fetchTodos(); // Kall fetchTodos uten token argument
      initializeEncryptionKey(); // Kall initializeEncryptionKey
    } else if (!isSignedIn) {
      // Hvis ikke logget inn, tøm todos og sett loading til false
      console.log("User not signed in. Clearing data.");
      setTodos([]);
      setLoading(false);
      setEncryptionKey(null); // Tøm nøkkelen også
      setError(null); // Nullstill feil
    }
    // Avhengigheter: userId, isSignedIn, og viktigst, session.
    // Effecten kjører når disse endrer seg. Når Clerk er ferdig med initialisering,
    // vil 'session' objektet gå fra null/undefined til et gyldig objekt,
    // og isSignedIn vil bli true (hvis brukeren er logget inn).
  }, [userId, isSignedIn, session]); // Inkluder session som avhengighet

  // Fjerner den dupliserte useEffecten

  if (loading) {
    return <div>Laster todos...</div>;
  }

  // Vis feilmelding hvis det oppstod en feil under lasting eller initialisering
  if (error) {
    return <div className="text-red-500">Det oppstod en feil: {error}</div>;
  }

  return (
    <>
      {/* Fjerner TestAuth fra hoved UI hvis den ikke er nødvendig lenger */}
      {/* <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-800">
           <TestAuth />
        </main> */}
      {/* Wrapper div for styling */}
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
            {/* Sender KUN encryptionKey til AddTodoForm */}
            {encryptionKey ? (
              <AddTodoForm
                encryptionKey={encryptionKey}
                // sessionToken fjernet
              />
            ) : (
              // Viser en melding mens nøkkelen lastes/initialiseres
              <p className="text-yellow-500">
                Initialiserer krypteringsnøkkel...
              </p>
            )}

            <div className="mt-6 space-y-2">
              {/* Itererer over todos og sender hver todo til TodoItem */}
              {todos.length === 0 && !loading && !error && (
                <p className="text-gray-400">
                  Ingen todos funnet. Legg til noen!
                </p>
              )}
              {todos.map((todo, index) => (
                // TodoItem håndterer nå auth/token selv
                <TodoItem key={todo._id || index} todo={todo} /> // Bruk todo._id som key hvis tilgjengelig
              ))}
            </div>
          </>
        ) : (
          // Vis melding og linker hvis ikke logget inn
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
            {/* Du kan også velge å ikke vise TestAuth hvis ikke logget inn */}
            {/* <TestAuth /> */}
          </div>
        )}
      </div>
    </>
  );
}
