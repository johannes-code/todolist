import { mongoose } from "mongoose";

const todoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  iv: {
    type: [Number],
    required: true,
  },
  data: {
    type: [Number],
    required: true, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const Todo = mongoose.models.Todo || mongoose.model("Todo", todoSchema);

export default Todo;
