

'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useUser } from '@clerk/nextjs';
import { initializeSodium } from '@/utils/encryption';
import TodoItem from '@/components/TodoItem';
import AddTodoForm from '@/components/AddTodoForm';

// Create a Context to hold the encryption key
const EncryptionKeyContext = createContext(null);
export const useEncryptionKey = () => useContext(EncryptionKeyContext);

function EncryptionKeyProvider({ children }) {
  const { isSignedIn, isLoading, user } = useUser();
  const [dataEncryptionKey, setDataEncryptionKey] = useState(null);
  const [sodiumInitialized, setSodiumInitialized] = useState(false);

  useEffect(() => {
    console.log('EncryptionKeyProvider - isSignedIn:', isSignedIn, 'user:', user);
    const initSodium = async () => {
      await initializeSodium();
      setSodiumInitialized(true);
    };

    initSodium();
  }, []);

  useEffect(() => {
    if (isSignedIn && user && sodiumInitialized) {
      const fetchEncryptionKey = async () => {
        try {
          const response = await fetch('api/encryption/retrieve-key');
          if (response.ok) {
            const data = await response.json();
            setDataEncryptionKey(data.dataEncryptionKey);
            console.log('Data encryption key retrieved successfully.');
          } else {
            console.error('Failed to retrieve data encryption key:', response.status);
            
          }
        } catch (error) {
          console.error('Error fetching data encryption key:', error);
          
        }
      };

      fetchEncryptionKey();
    } else if (!isSignedIn) {
      setDataEncryptionKey(null); // Clear the key on logout
    }
  }, [isSignedIn, user, sodiumInitialized]);

  return (
    <EncryptionKeyContext.Provider value={dataEncryptionKey}>
      {children}
    </EncryptionKeyContext.Provider>
  );
}

export default function HomeClient({ children }) { 
  return (
    <EncryptionKeyProvider>
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-4xl font-bold mb-6">Todo App</h1>
        {children} 
        <TodoItem/>
        <AddTodoForm />
      </div>
    </EncryptionKeyProvider>
  );
}

