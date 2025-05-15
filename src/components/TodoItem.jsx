"use client";

import { encryptData } from "@/app/lib/crypto-utils";
import { log, logError } from "@/app/utils/logger";

export default function TodoItem({ todo, onDelete, onUpdate, encryptionKey }) {
  const toggleCompleted = async () => {
    try {
      log("=== Debug toggleCompleted ===");
      log("1. encryptionKey:", encryptionKey);
      log("2. encryptionKey type:", typeof encryptionKey);
      log("3. Is CryptoKey?", encryptionKey instanceof CryptoKey);
      log("4. encryptionKey constructor:", encryptionKey?.constructor?.name);

      if (!encryptionKey) {
        logError("Encryption key is not available");
        return;
      }

      log("5. encryptData function:", encryptData);

      const currentTodoData = {
        id: todo._id,
        text: todo.text,
        completed: !todo.completed,
        createdAt: todo.createdAt,
      };

      log("6. About to call encryptData with:");
      log("   - key:", encryptionKey);
      log("   - data:", currentTodoData);

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
        logError("Server error:", error);
        throw new Error("Failed to update todo");
      }

      onUpdate(todo._id, { completed: !todo.completed });
    } catch (err) {
      logError("Error updating todo:", err);
    }
  };

  const deleteTodo = async () => {
    try {
      await fetch(`/api/todos/${todo._id}`, { method: "DELETE" });
      window.location.reload();
    } catch (err) {
      logError(err);
    }
  };

  return (
    <div>
      <div className="flex items-center w-40% justify-between p-4 border-b">
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

        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <span className="text-sm text-gray-500">
              Priority: {todo.priority}
            </span>
          </div>

          <button
            onClick={deleteTodo}
            className="text-red-500 hover:text-red-700 hover:scale-110 border border-red-500 rounded px-6 py-4 text-m"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
