// src/components/AddTodoForm.jsx
"use client";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { encryptData, hashUserIdToHex } from "../app/lib/crypto-utils";
import { log, logError } from "@/app/utils/logger";

export default function AddTodoForm({ encryptionKey, onTodoAdded }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [loading, setLoading] = useState(false);
  const { getToken, userId } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim() || !encryptionKey) {
      return;
    }

    log("Form submitted!");
    log("current text", text);
    log("Encryption key exists:", !!encryptionKey);

    setLoading(true);
    try {
      const token = await getToken();
      log("Token obtained:", token.substring(0, 20) + "...");

      if (!token || !userId) {
        throw new Error("Not authenticated");
      }

      const userIdHash = await hashUserIdToHex(userId);
      log("User ID hashed client-side");

      const todoData = {
        text: text.trim(),
        priority,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      log("Todo data before encryption:", todoData);

      const encryptedTodo = await encryptData(encryptionKey, todoData);

      log("Encrypted todo:", encryptedTodo);
      log("Encrypted todo iv type:", Array.isArray(encryptedTodo.iv));
      log(
        "Encrypted todo encryptedData type:",
        Array.isArray(encryptedTodo.encryptedData)
      );

      const requestBody = {
        todo: encryptedTodo,
        userIdHash: userIdHash,
      };

      log("Request body:", JSON.stringify(requestBody));

      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      log("Response status:", response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;

        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
            console.error("Server error:", errorData);
          }
        } catch (e) {
          logError("Could not parse error response:", e);
        }

        throw new Error(errorMessage);
      }

      setText("");
      setPriority("Medium");

      onTodoAdded();
    } catch (error) {
      logError("Error adding todo:", error);
      alert(`Failed to add todo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter a new todo..."
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading || !encryptionKey}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button
          type="submit"
          disabled={loading || !text.trim() || !encryptionKey}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Adding..." : "Add Todo"}
        </button>
      </div>
    </form>
  );
}
