//src/models/Todo.jsx

import { mongoose } from "mongoose";

const todoSchema = new mongoose.Schema({
  ciphertext: { type: Buffer, required: true },
  iv: { type: Buffer, required: true },
  completed: { type: Boolean, default: false },
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Medium",
  },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Todo = mongoose.models.Todo || mongoose.model("Todo", todoSchema);

export default Todo;
