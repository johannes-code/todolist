import { mongoose } from "mongoose";

const todoSchema = new mongoose.Schema({
  iv: { type: [Number], requred: true },
  data: {type: [Number], required: true },
  createdAt: { type: Date, default: Date.now },
}, { strict: false });


const Todo = mongoose.models.Todo || mongoose.model("Todo", todoSchema);

export default Todo;
