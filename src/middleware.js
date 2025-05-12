// src/middleware.js
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  // Optional: Add debug logging
  debug: true,
  // Sign-in and sign-up are public by default
  // All other routes are protected by default
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
