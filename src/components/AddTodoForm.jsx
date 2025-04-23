"use client";

import { useState } from "react";
import { useSession } from "@clerk/nextjs"; // Importer useSession
import { encryptData } from "@/app/utils/encryptionUtils";

// Fjern sessionToken prop
export default function AddTodoForm({ encryptionKey }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("Medium");
  const { session, isSignedIn } = useSession(); // Bruk useSession for å få tak i session

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sjekk om brukeren er logget inn og sesjonen er klar
    if (!isSignedIn || !session) {
      console.error("Bruker ikke logget inn eller sesjon ikke klar.");
      // Her kan du vise en feilmelding i UI
      return;
    }

    try {
      const encrypted = await encryptData(encryptionKey, text);

      // Hent tokenet her, like før backend-kall
      const sessionToken = await session.getToken();

      if (!sessionToken) {
        throw new Error("Kunne ikke hente autentiseringstoken for POST.");
      }

      console.log("Session Token i AddTodoForm handleSubmit:", sessionToken);

      const res = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Inkluder tokenet i Authorization headeren
          Authorization: `Bearer ${sessionToken}`, // Standard format 'Bearer' + token
        },
        body: JSON.stringify({
          ciphertext: Array.from(new Uint8Array(encrypted.ciphertext)),
          iv: Array.from(new Uint8Array(encrypted.iv)),
          priority: priority,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Backend feil ved adding todo: ${res.status} ${res.statusText} - ${errorText}`
        );
      }

      // Oppdater UI eller last siden på nytt etter suksess
      setText("");
      window.location.reload();
    } catch (err) {
      console.error("Feil ved legging til todo:", err);
      // Håndter feil i UI
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="Add new todo..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="p-2 border border-gray-300 rounded text-white bg-black"
      >
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
      <button type="submit" className="p-2 bg-blue-500 text-white rounded">
        Add
      </button>
    </form>
  );
}
