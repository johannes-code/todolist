// src/app/hooks/useTodos.js
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { decryptData } from "@/app/lib/crypto-utils";
import { log, logError } from "@/app/utils/logger";

export function useTodos(encryptionKey, refreshKey) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    let mounted = true;

    async function fetchTodos() {
      if (!isSignedIn || !encryptionKey) return;

      try {
        setLoading(true);
        const token = await getToken();

        const res = await fetch("/api/todos", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const encryptedTodos = await res.json();
        const decrypted = await Promise.all(
          encryptedTodos.map(async (todo) => {
            if (!todo.iv || !todo.encryptedData) return null;
            const data = await decryptData(encryptionKey, {
              iv: todo.iv,
              data: todo.encryptedData,
            });
            return { _id: todo._id, ...data, createdAt: todo.createdAt };
          })
        );

        if (mounted) setTodos(decrypted.filter(Boolean));
      } catch (err) {
        logError("Fetch failed:", err);
        if (mounted) setError("Failed to fetch todos");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchTodos();
    return () => (mounted = false);
  }, [isSignedIn, encryptionKey, refreshKey]);

  return { todos, loading, error, setTodos };
}
