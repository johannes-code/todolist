"use client";
import { useState, useEffect } from "react";
import AddTodoForm from "@/components/AddTodoForm";
import TodoItem from "@/components/TodoItem";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { 
  generateEncryptionKey, 
  encryptData, 
  decryptData, 
  encryptWithSession, 
  decryptWithSession 
} from "./lib/crypto-utils";

function TodoListComponent() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [keyInitialized, setKeyInitialized] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [initError, setInitError] = useState(null);
  const { isSignedIn, getToken } = useAuth();
  const [sessionToken, setSessionToken] = useState(null);

  // Get session token
  useEffect(() => {
    async function fetchToken() {
      if (isSignedIn) {
        try {
          const token = await getToken();
          console.log("Retrieved session token:", !!token);
          setSessionToken(token);
        } catch (err) {
          console.error("Failed to get token:", err);
          setInitError("Failed to get session token");
        }
      }
    }
    fetchToken();
  }, [isSignedIn, getToken]);

  // Key Initialization
  useEffect(() => {
    let mounted = true;
    
    async function initializeKey() {
      try {
        if (!isSignedIn || !sessionToken) {
          console.log("Waiting for session token...");
          return;
        }
        
        console.log("Initializing encryption key...");
        const storedKey = localStorage.getItem('encryptedKey');
        let key;

        if (storedKey) {
          console.log("Found existing encrypted key");
          key = await decryptWithSession(JSON.parse(storedKey), sessionToken);
        } else {
          console.log("Generating new encryption key");
          key = await generateEncryptionKey();
          const encryptedKey = await encryptWithSession(key, sessionToken);
          localStorage.setItem('encryptedKey', JSON.stringify(encryptedKey));
        }

        if (mounted) {
          setEncryptionKey(key);
          setKeyInitialized(true);
          console.log("Key initialized successfully:", !!key);
        }
      } catch (error) {
        console.error("Key initialization failed:", error);
        if (mounted) {
          setInitError("Failed to initialize encryption");
          setKeyInitialized(true);
        }
      }
    }

    initializeKey();
    
    return () => {
      mounted = false;
    };
  }, [isSignedIn, sessionToken]);

  // Todo Fetching
  useEffect(() => {
    let mounted = true;
    
    async function fetchTodos() {
      try {
        if (!isSignedIn || !encryptionKey) {
          if (mounted) setTodos([]);
          return;
        }

        setLoading(true);
        const response = await fetch("/api/todos");
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const encryptedTodos = await response.json();
        console.log("Received todos:", encryptedTodos.length);

        const decryptedTodos = await Promise.all(
          encryptedTodos.map(async (encryptedTodo) => {
            try {
              const decrypted = await decryptData(encryptionKey, {
                iv: encryptedTodo.iv,
                data: encryptedTodo.data
              });
              return {
                _id: encryptedTodo._id,
                ...decrypted,
                createdAt: encryptedTodo.createdAt
              };
            } catch (error) {
              console.error("Failed to decrypt todo:", error);
              return null;
            }
          })
        );

        if (mounted) {
          setTodos(decryptedTodos.filter(Boolean));
        }
      } catch (error) {
        console.error("Todo fetch failed:", error);
        if (mounted) setInitError("Failed to load todos");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchTodos();
    
    return () => {
      mounted = false;
    };
  }, [isSignedIn, encryptionKey, refreshKey]);

  const handleAddTodo = async () => {
    setRefreshKey(Date.now()); // Trigger refresh
  };

  if (!isSignedIn) {
    return (
      <div className="text-center space-y-2">
        <p>
          Please{" "}
          <Link href="/sign-in" className="text-blue-500 hover:underline">
            sign in
          </Link>
        </p>
        <p>
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-blue-500 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    );
  }

  if (!keyInitialized) {
    return <div className="text-center py-4">Initializing encryption...</div>;
  }

  if (initError) {
    return (
      <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {initError}
      </div>
    );
  }

  return (
    <>
      <AddTodoForm 
        encryptionKey={encryptionKey}
        onTodoAdded={handleAddTodo} 
      />
      <div className="mt-6 space-y-2">
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : todos.length === 0 ? (
          <p className="text-center text-gray-500">No todos yet. Add one above!</p>
        ) : (
          todos.map((todo) => (
            <TodoItem key={todo._id} todo={todo} />
          ))
        )}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Todo App</h1>
      <TodoListComponent />
    </div>
  );
}