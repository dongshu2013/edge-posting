interface FetchOptions extends RequestInit {
  auth?: boolean;
}

export async function fetchApi(endpoint: string, options: FetchOptions = {}) {
  const { auth = true, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  if (auth) {
    const token = localStorage.getItem("authToken");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    } else {
      console.warn("Auth token not found but required for", endpoint);
      throw new Error("Authentication required. Please sign in.");
    }
  }

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
