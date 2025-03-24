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
  pages: ["/buzz/new", "/buzz/my", "/buzz/my/replies", "/play", "/profile"],
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
    // 处理动态路由参数
    if (type === "api") {
      const pathSegments = path.split("/");
      const routeSegments = route.split("/");
      // 检查路径段数是否匹配
      if (pathSegments.length === routeSegments.length) {
        // 检查每个段是否匹配，忽略动态参数段
        const isMatch = routeSegments.every((segment, index) => {
          // 如果是通配符段，则跳过匹配
          if (segment === "*") return true;
          // 如果是动态参数段（以冒号开头），则跳过匹配
          if (segment.startsWith(":")) return true;
          return segment === pathSegments[index];
        });
        if (isMatch) return true;
      }
    }
    // 精确匹配所有路由
    return path === route;
  });
}
