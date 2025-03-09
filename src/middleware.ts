import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedApiRoutes = [
  "/api/buzz/*",
  "/api/reply",
  "/api/reply/*",
  "/api/user",
  "/api/user/*",
  "/api/withdraw",
  "/api/withdraw/*",
];

// Client-side routes that require authentication
const protectedPages = [
  "/buzz/new",
  "/buzz/my",
  "/history",
  "/play",
  "/profile",
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Handle API route protection
  if (path.startsWith("/api")) {
    // Skip auth verification for the verify-token endpoint itself
    if (path === "/api/auth/verify-token") {
      return NextResponse.next();
    }

    // Check if the path matches any protected API route patterns
    const isProtectedApiRoute = protectedApiRoutes.some((route) => {
      if (route.includes("*")) {
        const pattern = route.replace("*", ".*");
        return new RegExp(pattern).test(path);
      }
      return route === path;
    });

    if (!isProtectedApiRoute) {
      return NextResponse.next();
    }

    try {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json(
          { error: "Missing or invalid authorization header" },
          { status: 401 }
        );
      }

      // Verify token using our API route
      const verifyResponse = await fetch(
        new URL("/api/auth/verify-token", request.url),
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
          },
        }
      );

      if (!verifyResponse.ok) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }

      const userData = await verifyResponse.json();

      // Add user info to request headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", userData.uid);
      requestHeaders.set("x-user-email", userData.email || "");

      return NextResponse.next({
        headers: requestHeaders,
      });
    } catch (error) {
      console.error("Auth error:", error);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
  }

  // Handle client-side route protection
  const isProtectedPage = protectedPages.some((route) =>
    path.startsWith(route)
  );

  if (isProtectedPage) {
    // Check for auth token
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
      // User is not authenticated, redirect to buzz page with signin=true
      const url = new URL("/buzz", request.url);
      url.searchParams.set("signin", "true");
      return NextResponse.redirect(url);
    }

    // User has a token, let them proceed
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/buzz/new",
    "/buzz/my",
    "/history",
    "/play",
    "/profile/:path*",
  ],
};
