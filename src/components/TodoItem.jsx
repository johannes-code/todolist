// component/AddTodoForm.jsx

"use client";

import { useState } from "react";
import { useSession } from "@clerk/nextjs"; // Importer useSession

export default function TodoItem({ todo }) {
  const [completed, setCompleted] = useState(todo.completed);
  const { session, isSignedIn } = useSession(); // Bruk useSession

  // Hjelpefunksjon for å hente token og inkludere i header
  const fetchWithAuth = async (url, options = {}) => {
    if (!isSignedIn || !session) {
      throw new Error("Bruker ikke logget inn eller sesjon ikke klar.");
    }
    const sessionToken = await session.getToken();
    if (!sessionToken) {
      throw new Error("Kunne ikke hente autentiseringstoken.");
    }

    const headers = {
      ...options.headers, // Behold eventuelle eksisterende headere
      Authorization: `Bearer ${sessionToken}`, // Legg til Authorization header
      "Content-Type": "application/json", // Sørg for JSON Content-Type
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Backend feil: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response;
  };

  const toggleCompleted = async () => {
    try {
      // Bruk fetchWithAuth
      const res = await fetchWithAuth(`api/todos/${todo._id}`, {
        method: "PUT",

        body: JSON.stringify({ completed: !completed }),
      });

      setCompleted(!completed); // Oppdater state basert på det du prøvde å sende
    } catch (err) {
      console.error("Feil ved oppdatering av todo:", err);
      // Håndter feil i UI
    }
  };

  const deleteTodo = async () => {
    try {
      // Bruk fetchWithAuth
      await fetchWithAuth(`/api/todos/${todo._id}`, { method: "DELETE" });

      window.location.reload();
    } catch (err) {
      console.error("Feil ved sletting av todo:", err);
      // Håndter feil i UI
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-4 flex-grow">
        <input
          type="checkbox"
          checked={completed}
          onChange={toggleCompleted}
          className="h-5 w-5 flex-shrink-0"
        />
        <span
          className={completed ? "line-through text-gray-400 " : ""}
          style={{ minWidth: 0, overflowWrap: "break-word" }}
        >
          {todo.text}
        </span>
      </div>
      <div className="flex items-center space-x-4 flex-shrink-0">
        <span className="text-sm text-gray-500 whitespace-nowrap">
          Priority: {todo.priority}
        </span>

        <button
          onClick={deleteTodo}
          className=" border rounded p-2 text-red-500 hover:text-red-700 flex-shrink-0"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
