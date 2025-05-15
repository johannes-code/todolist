// src/app/hooks/useEncryptionKey.js
import { useState, useEffect } from "react";
import { deriveKeyFromUserId } from "@/app/lib/crypto-utils";
import { log, logError } from "@/app/utils/logger";
import { useAuth } from "@clerk/nextjs";

export function useEncryptionKey() {
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  const { isSignedIn, userId } = useAuth();

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        if (!isSignedIn || !userId) return;

        const key = await deriveKeyFromUserId(userId);
        if (mounted) {
          setEncryptionKey(key);
          setInitialized(true);
          log("Encryption key initialized");
        }
      } catch (err) {
        logError("Key init failed:", err);
        if (mounted) {
          setError("Encryption failed to initialize");
          setInitialized(true);
        }
      }
    }

    initialize();
    return () => (mounted = false);
  }, [isSignedIn, userId]);

  return { encryptionKey, initialized, error };
}
