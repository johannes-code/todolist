"use client";

import { useAuth } from "@clerk/nextjs";

export default function TestAuth() {
  const { sessionToken, isSignedIn, userId } = useAuth();

  return (
    <div>
      <p>Is Signed In: {isSignedIn ? "Yes" : "No"}</p>
      <p>User ID: {userId || "Loading..."}</p>
      <p>Session Token: {sessionToken || "Loading..."}</p>
    </div>
  );
}
