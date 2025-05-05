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
        // headers: { "Content-Type": "application/json" }, // Fjern, håndteres i fetchWithAuth
        body: JSON.stringify({ completed: !completed }),
      });
      // Merk: Når du bruker fetchWithAuth, er response.ok allerede sjekket inni den funksjonen
      // Hvis du får tilbake en data payload, kan du hente den her:
      // const updatedTodo = await res.json();
      // setCompleted(updatedTodo.completed); // Eller sett basert på det du sendte
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
      // Hvis sletting er vellykket, fjern elementet fra UI uten full side reload
      // Dette krever at parent komponenten (TodoListComponent) har state for todos og en funksjon for å fjerne en todo
      // For nå beholder vi reload for enkelthets skyld, men state-basert oppdatering er bedre UX.
      window.location.reload();
    } catch (err) {
      console.error("Feil ved sletting av todo:", err);
      // Håndter feil i UI
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-4">
        <input
          type="checkbox"
          checked={completed}
          onChange={toggleCompleted}
          className="h-5 w-5"
        />
        <span className={completed ? "line-through text-gray-400" : ""}>
          {todo.text} {/* Antar 'text' er feltet for todo-tekst */}
        </span>
      </div>
      <div>
        <span className="text-sm text-gray-500">Priority: {todo.priority}</span>
      </div>
      <button onClick={deleteTodo} className="text-red-500 hover:text-red-700">
        Delete
      </button>
    </div>
  );
}
