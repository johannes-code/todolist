"use client"

import { SignUp, useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export default function SignUpPage() {
  const { user } = useUser();

  useEffect(() => {
    if (user && user.id) {
      triggerBackEndKeyGeneration(user.id);
    }
  }, [user]);

  const triggerBackEndKeyGeneration = async (userId) => {
    try {
      const response = await fetch("api/encryption/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (response.ok) {
        console.log("Encryption key setup triggered on the backend.");
      } else {
        console.error("Failed to trigger encrytion key setup.");
      }
    } catch (error) {
      console.error("Error triggering encrytion key setup:", error);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <SignUp fallbackRedirectUrl="/" />
    </div>
  );
}
