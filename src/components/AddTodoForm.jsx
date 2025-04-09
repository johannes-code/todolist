"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

 export default function AddTodoForm() {
   const [text, setText] = useState("");
   const { sessionToken } = useAuth();

   const handleSubmit = async (e) => {
     e.preventDefault();
     console.log("handleSubmint function called!")
     console.log("Attempting to fetch....")
     try {
       const res = await fetch("/api/todos", {
         method: "POST",
         headers: { 
          "Content-Type": "application/json" ,
          Authorization: `bearer ${sessionToken}`,
         },
         body: JSON.stringify({ text }),
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
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new todo..."
        className="flex-1 p-2 border rounded"
        required
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Add
      </button>
    </form>
  );
}
