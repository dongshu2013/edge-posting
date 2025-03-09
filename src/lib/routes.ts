// 新建一个统一的路由配置文件
export const protectedRoutes = {
  api: [
    "/api/buzz/create",
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
    // 处理通配符路由
    if (route.includes("*")) {
      const baseRoute = route.split("*")[0];
      const pattern = route.replace("*", ".*");
      // API 路由使用正则匹配，页面路由只匹配基础路径
      return type === "api"
        ? new RegExp(pattern).test(path)
        : path === baseRoute;
    }
    // 精确匹配所有路由
    return path === route;
  });
}
