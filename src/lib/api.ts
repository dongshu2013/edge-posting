interface FetchOptions extends RequestInit {
  auth?: boolean;
}

// List of endpoints that always require authentication
const protectedEndpoints = [
  '/api/buzz/new',
  '/api/buzz/my',
  '/api/reply',
  '/api/user',
  '/api/withdraw',
  '/api/user/*/update-nickname',
];

export async function fetchApi(endpoint: string, options: FetchOptions = {}) {
  const { auth, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  // Check if the endpoint requires authentication
  const requiresAuth = auth ?? protectedEndpoints.some(path => {
    if (path.includes('*')) {
      const pattern = path.replace('*', '.*');
      return new RegExp(pattern).test(endpoint);
    }
    return endpoint.startsWith(path);
  });

  if (requiresAuth) {
    const token = localStorage.getItem("authToken");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    } else {
      console.warn("Auth token not found but required for", endpoint);
      throw new Error("Authentication required. Please sign in.");
    }
  }

  console.log(`Fetching ${endpoint} with auth: ${requiresAuth}`);
  
  const response = await fetch(endpoint, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error(`API error (${response.status}):`, error);
    throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
