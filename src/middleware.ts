import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { protectedRoutes, isProtectedRoute } from "@/lib/routes";

async function verifyAuthToken(token: string, requestUrl: string) {
  const verifyResponse = await fetch(
    new URL("/api/auth/verify-token", requestUrl),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!verifyResponse.ok) {
    return null;
  }

  return verifyResponse.json();
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/api")) {
    if (path === "/api/auth/verify-token") {
      return NextResponse.next();
    }

    if (!isProtectedRoute(path, "api")) {
      return NextResponse.next();
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const userData = await verifyAuthToken(authHeader, request.url);
    if (!userData) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", userData.uid);
    requestHeaders.set("x-user-email", userData.email || "");

    return NextResponse.next({ headers: requestHeaders });
  }

  // 处理客户端页面路由
  if (isProtectedRoute(path, "pages")) {
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
      const url = new URL("/buzz", request.url);
      url.searchParams.set("signin", "true");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    ...protectedRoutes.pages, // 直接使用 routes 中定义的页面路由
  ],
};
