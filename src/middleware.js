// src/middelware.js

import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/api/webhook/clerk",
  ],

  
  // Optional: Enable debug mode to see more information
  debug: process.env.NODE_ENV === 'development',
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/(api|trpc)(.*)",
  ],
};