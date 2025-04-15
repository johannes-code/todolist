import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isApiRoute(req)) {
    // await auth.protect(); // Try using auth.protect() for API routes
  } else {
    const publicRoutes = [/^\/$/, /^\/sign-up$/,/^\/sign-in$/ ];
    const isPublicRoute = publicRoutes.some((route) => route.test(req.nextUrl.pathname));
    if (!isPublicRoute) {
      const user = auth.user;
      if (!user) {
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/',
    '/sign-in',
    '/sign-up',
  ],
};