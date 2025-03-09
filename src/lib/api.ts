import { isProtectedRoute } from "@/lib/routes";

interface FetchOptions extends RequestInit {
  auth?: boolean;
}

export async function fetchApi(endpoint: string, options: FetchOptions = {}) {
  const { auth, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  const requiresAuth = auth ?? isProtectedRoute(endpoint, "api");

  if (requiresAuth) {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Authentication required. Please sign in.");
    }
    headers.set("authorization", `Bearer ${token}`);
  }

  console.log(`Fetching ${endpoint} with auth: ${requiresAuth}`);

  const response = await fetch(endpoint, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error(`API error (${response.status}):`, error);
    throw new Error(
      error.error || `Error ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}
