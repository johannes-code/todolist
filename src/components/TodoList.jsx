// src/app/components/TodoList.jsx
import TodoItem from "./TodoItem";

export default function TodoList({ todos, loading, encryptionKey, onUpdate }) {
  if (loading) return <p className="text-center">Loading...</p>;

  if (todos.length === 0) {
    return <p className="text-center text-gray-500">No todos yet.</p>;
  }

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <TodoItem
          key={todo._id}
          todo={todo}
          encryptionKey={encryptionKey}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
