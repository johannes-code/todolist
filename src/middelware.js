import { clerkMiddleware, auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default clerkMiddleware((auth, req) => {
    publicRoutes: ['/']
    // This function will be called with the auth and request objects

    if (!auth().userId && !req.nextUrl.pathname !== '/') { // Example: Redirect if not signed in and not on the homepage
        return NextResponse.redirect(new URL('/sign-in', req.url)); // Assuming you have a /sign-in route
      }

      return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    ],
};