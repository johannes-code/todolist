"use client";

import { useState } from "react";

export default function TodoItem({ todo }) {
  const [completed, setCompleted] = useState(todo.completed);

  const toggleCompleted = async () => {
    try {
      const res = await fetch(`api/todos/${todo._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      if (res.ok) setCompleted(!completed);
    } catch (err) {
      console.error(err);
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
      <div className="flex items-center space-x-4 flex-grow">
        <input
          type="checkbox"
          checked={completed}
          onChange={toggleCompleted}
          className="h-5 w-5 flex-shrink-0"
        />
<<<<<<< Updated upstream
        <span className={completed ? "line-through text-gray-400" : ""}>
=======
        <span
          className={completed ? "line-through text-gray-400 " : ""}
          style={{ minWidth: 0, overflowWrap: "break-word" }}
        >
>>>>>>> Stashed changes
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
