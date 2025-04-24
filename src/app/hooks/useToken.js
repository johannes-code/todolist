// hooks/useToken.js
"use client";
import { useSession } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function useToken() {
  const { session } = useSession();
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      try {
        if (!session) {
          setToken(null);
          return;
        }

        const t = await session.getToken();
        console.log(
          "Token retrieved at:",
          new Date().toISOString(),
          t ? "✅" : "❌"
        );
        setToken(t);
        setError(null);
      } catch (err) {
        console.error("Token fetch failed:", err);
        setError(err);
        setToken(null);
      }
    };

    getToken();

    // Add polling if tokens expire quickly
    const interval = setInterval(getToken, 60_000);
    return () => clearInterval(interval);
  }, [session]);

  return { token, error };
}
