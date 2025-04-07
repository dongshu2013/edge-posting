import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProtectedRoute } from "@/lib/routes";

// async function verifyAuthToken(token: string, requestUrl: URL) {
//   const verifyResponse = await fetch(
//     new URL("/api/auth/verify-token", requestUrl),
//     {
//       method: "POST",
//       headers: {
//         Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
//       },
//     }
//   );

//   if (!verifyResponse.ok) {
//     console.log("Token verification failed:", await verifyResponse.text());
//     return null;
//   }

//   return verifyResponse.json();
// }

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // API 路由处理
  if (path.startsWith("/api")) {
    // 避免验证接口自身，防止循环调用
    if (path === "/api/auth/verify-token") {
      return NextResponse.next();
    }

    if (!isProtectedRoute(path, "api")) {
      return NextResponse.next();
    }

    // const authHeader = request.headers.get("authorization");
    // if (!authHeader) {
    //   return NextResponse.json(
    //     { error: "Missing authorization header" },
    //     { status: 401 }
    //   );
    // }

    // const userData = await verifyAuthToken(authHeader, request.nextUrl);
    // if (!userData) {
    //   return NextResponse.json(
    //     { error: "Invalid or expired token" },
    //     { status: 401 }
    //   );
    // }

    const requestHeaders = new Headers(request.headers);
    // requestHeaders.set("x-user-id", userData.uid);
    // requestHeaders.set("x-user-email", userData.email || "");

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
    "/buzz/new",
    "/buzz/my",
    "/buzz/my/replies",
    "/play",
    "/profile",
  ],
};
