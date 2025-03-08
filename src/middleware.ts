import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/api/buzz", // 添加无通配符的路由
  "/api/buzz/*", // 保留通配符路由用于子路径
  "/api/reply",
  "/api/reply/*",
  "/api/user",
  "/api/user/*",
  "/api/withdraw",
  "/api/withdraw/*",
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip auth verification for the verify-token endpoint itself
  if (path === "/api/auth/verify-token") {
    return NextResponse.next();
  }

  // Check if the path matches any protected route patterns
  const isProtectedRoute = protectedRoutes.some((route) => {
    if (route.includes("*")) {
      const pattern = route.replace("*", ".*");
      return new RegExp(pattern).test(path);
    }
    return route === path;
  });

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  try {
    const authHeader = request.headers.get("Authorization");
    console.log("(....)", authHeader);
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

export const config = {
  matcher: ["/api/:path*"],
};
