import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, request) => {
  const publicRoutes = [/^\/$/, /^\/sign-up$/,/^\/sign-in$/ ];

  const isPublicRoute = publicRoutes.some((route) => route.test(request.nextUrl.pathname));

  if (!isPublicRoute) {
    const user = auth.user
      
    if (!user)
    return NextResponse.redirect(new URL('/sign-in', request.url));
    
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
