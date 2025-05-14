"use client";

import { encryptData } from "@/app/lib/crypto-utils";

export default function TodoItem({ todo, onDelete, onUpdate, encryptionKey }) {
  const toggleCompleted = async () => {
    try {
      console.log("=== Debug toggleCompleted ===");
      console.log("1. encryptionKey:", encryptionKey);
      console.log("2. encryptionKey type:", typeof encryptionKey);
      console.log("3. Is CryptoKey?", encryptionKey instanceof CryptoKey);
      console.log(
        "4. encryptionKey constructor:",
        encryptionKey?.constructor?.name
      );

      if (!encryptionKey) {
        console.error("Encryption key is not available");
        return;
      }

      console.log("5. encryptData function:", encryptData);

      const currentTodoData = {
        id: todo._id,
        text: todo.text,
        completed: !todo.completed,
        createdAt: todo.createdAt,
      };

      console.log("6. About to call encryptData with:");
      console.log("   - key:", encryptionKey);
      console.log("   - data:", currentTodoData);

      const encryptedUpdate = await encryptData(encryptionKey, currentTodoData);

      const response = await fetch(`/api/todos/${todo._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          iv: encryptedUpdate.iv,
          encryptedData: encryptedUpdate.encryptedData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Server error:", error);
        throw new Error("Failed to update todo");
      }

      onUpdate(todo._id, { completed: !todo.completed });
    } catch (err) {
      console.error("Error updating todo:", err);
    }
  };

  const deleteTodo = async () => {
    try {
      await fetch(`/api/todos/${todo._id}`, { method: "DELETE" });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-4">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={toggleCompleted}
          className="h-5 w-5"
        />
        <span className={todo.completed ? "line-through text-gray-400" : ""}>
          {todo.text}
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
