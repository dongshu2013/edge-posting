// 新建一个统一的路由配置文件
export const protectedRoutes = {
  api: [
    "/api/buzz/*",
    "/api/reply",
    "/api/reply/*",
    "/api/user",
    "/api/user/*",
    "/api/withdraw",
    "/api/withdraw/*",
  ],
  pages: ["/buzz/new", "/buzz/my", "/history", "/play", "/profile"],
};

export function isProtectedRoute(path: string, type: "api" | "pages"): boolean {
  return protectedRoutes[type].some((route) => {
    if (route.includes("*")) {
      const pattern = route.replace("*", ".*");
      return new RegExp(pattern).test(path);
    }
    return path.startsWith(route);
  });
}
