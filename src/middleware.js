// src/middleware.js
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  debug: false,
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
