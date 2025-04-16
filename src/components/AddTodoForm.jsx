"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { encryptData } from "@/app/utils/encryptionUtils";

export default function AddTodoForm({ encryptionKey }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("Medium");
  const { sessionToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const encrypted = await encryptData(encryptionKey, text);
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          ciphertext: Array.from(new Uint8Array(encrypted.ciphertext)),
          iv: Array.from(new Uint8Array(encrypted.iv)),
          priority: priority,
        }),
      });
      if (res.ok) {
        setText("");
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
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
