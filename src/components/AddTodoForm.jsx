//src/components/AddTodoForm

"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { encryptData } from "@/app/lib/crypto-utils";

export default function AddTodoForm({ encryptionKey, onTodoAdded }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [ isSubmitting, setIsSubmitting ] = useState(false);
  const { sessionToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted!");
    console.log("current text", text);
    console.log("Encryption key exists:", !!encryptionKey);
    if (!text.trim() || !encryptionKey) return;

    setIsSubmitting(true);

    try {
      const todoData = {
        text,
        priority,
        createdAt: new Date().toISOString()
      };

      const encryptedTodo = await encryptData(encryptionKey, todoData);
      console.log("Encrypted todo:", encryptedTodo);

      const res = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer ${sessionToken}`,
        },
        body: JSON.stringify({ encryptedTodo }),
      });

      if (res.ok) {
        setText("");
        setPriority("Medium")
        onTodoAdded?.()
      }else {
        console.error("Failed to add todo:", await res.text());
      }
    }catch(err) {
      console.error("Error adding todo", err);    
    }finally {
       setIsSubmitting(false);
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
      <button type="submit" className="p-2 bg-blue-500 text-white rounded disabled:opacity-50"
      disabled={isSubmitting || !text.trim()}
      >
        {isSubmitting ? "Adding..." : "Add" }
        
      </button>
    </form>
  );
}
