//src/components/AddTodoForm

"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { encryptData } from "@/app/lib/crypto-utils";

export default function AddTodoForm({ encryptionKey, onTodoAdded }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { getToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!text.trim() || !encryptionKey) return;

    setIsSubmitting(true);

    try {
      console.log("Form submitted!");
      console.log("current text", text);
      console.log("Encryption key exists:", !!encryptionKey);

      // Get the session token
      const sessionToken = await getToken();
      console.log(
        "Token obtained:",
        sessionToken ? `${sessionToken.substring(0, 20)}...` : "No token"
      );

      if (!sessionToken) {
        console.error("No session token available");
        setError("No session token available");
        return;
      }

      // Create todo data
      const todoData = {
        text,
        priority,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      console.log("Todo data before encryption:", todoData);

      // Encrypt the todo data
      const encryptedTodo = await encryptData(encryptionKey, todoData);
      console.log("Encrypted todo:", encryptedTodo);
      console.log("Encrypted todo iv type:", Array.isArray(encryptedTodo.iv));
      console.log(
        "Encrypted todo encryptedData type:",
        Array.isArray(encryptedTodo.encryptedData)
      );

      // Create request body
      const requestBody = { todo: encryptedTodo };
      console.log("Request body:", JSON.stringify(requestBody));

      const res = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`, // Capital 'B' in Bearer
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", res.status);

      if (!res.ok) {
        let errorMessage = `Failed with status ${res.status}`;

        try {
          const errorData = await res.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        throw new Error(errorMessage);
      }

      setText("");
      setPriority("Medium");
      onTodoAdded?.();
    } catch (err) {
      console.error("Error adding todo:", err);
      setError(err.message || "Failed to add todo");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Add new todo..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          disabled={isSubmitting}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="p-2 border border-gray-300 rounded text-white bg-black"
          disabled={isSubmitting}
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded disabled:opacity-50"
          disabled={isSubmitting || !text.trim()}
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </form>
      {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
    </div>
  );
}
