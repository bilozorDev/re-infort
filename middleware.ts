import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/api/protected(.*)",
]);

const isAuthPage = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // Skip protection for Clerk webhooks
  if (pathname === "/api/clerk/webhooks") {
    return NextResponse.next();
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url);
    await auth.protect({
      unauthenticatedUrl: signInUrl.toString(),
    });
  }

  // Get auth object to check organization
  const authObj = await auth();

  // Redirect to organization selection if user has no organization
  if (
    authObj.userId &&
    !authObj.orgId &&
    req.nextUrl.pathname.includes("/dashboard") &&
    !req.nextUrl.pathname.endsWith("/organization-selection")
  ) {
    const orgSelection = new URL("/onboarding/organization-selection", req.url);
    return NextResponse.redirect(orgSelection);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
