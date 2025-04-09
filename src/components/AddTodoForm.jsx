 "use client";

import { useState } from "react";

//  export default function AddTodoForm() {
//    const [text, setText] = useState("");

//    const handleSubmit = async (e) => {
//      e.preventDefault();
//      console.log("handleSubmint function called!")
//      console.log("Attempting to fetch....")
//      try {
//        const res = await fetch("/api/todos", {
//          method: "POST",
//          headers: { "Content-Type": "application/json" },
//          body: JSON.stringify({ text }),
//        });
//        if (res.ok) {
//          setText("");
//          window.location.reload();
//        }
//      } catch (err) {
//        console.error(err);
//      }
//    };






  // return (
  //   <form onSubmit={handleSubmit} className="flex space-x-2">
  //     <input
  //       type="text"
  //       value={text}
  //       onChange={(e) => setText(e.target.value)}
  //       placeholder="Add a new todo..."
  //       className="flex-1 p-2 border rounded"
  //       required
  //     />
  //     <button
  //       type="submit"
  //       className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
  //     >
  //       Add
  //     </button>
  //   </form>
  // );


export default function AddTodoForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit called");
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "test todo" }), // Hardcoded text
      });
      if (res.ok) {
        console.log("POST request successful");
        // window.location.reload();
      } else {
        console.error("POST request failed:", res.status);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Add Test Todo</button>
    </form>
  );
}