import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isApiRoute = createRouteMatcher(["/api(.*)"]);
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/trpc(.*)", // Add any public API routes here
]);

export default clerkMiddleware(async (auth, req) => {
  // 1. Protect all API routes except public ones
  if (isApiRoute(req) && !isPublicRoute(req)) {
    await auth().protect(); // Enforce authentication for protected APIs
  }

  // 2. Handle page route protections
  if (!isPublicRoute(req)) {
    const user = auth().userId; // More efficient check

    if (!user) {
      // Redirect to sign-in while preserving the original path
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|_static|_vercel|[^/]+\\.\\w+).*)", // Simplified matcher
    "/",
    "/(api|trpc)(.*)",
  ],
};
