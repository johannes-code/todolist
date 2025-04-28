import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up", "/api/public(/*)"],
  ignoredRoutes: ["/((?!api|trpc))(_next|.+..+)(.+)"],
  debug: true,
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/"],
};
