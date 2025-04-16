export async function sendCommonGet<T>(
    path: string,
    params: object,
    options?: {
      headers?: any;
      onError?: (errMessage: string) => void;
    }
  ): Promise<T | undefined> {
    try {
      const headers: any = {
        "Content-Type": "application/json",
        ...options?.headers,
      };
  
      const response = await fetch(
        `${path}?` + new URLSearchParams({ ...params }),
        {
          method: "GET",
          headers,
        }
      );
  
      if (!response.ok) {
        // console.log(response);
        options?.onError?.(response.statusText);
        return undefined;
      }
  
      const resJson = await response.json();
  
      // Check common error code
      if (resJson?.code === 401) {
        options?.onError?.("Unauthorized");
        return undefined;
      }
  
      return resJson;
    } catch (err: any) {
    console.log(err);
    options?.onError?.(err.message || "Network error");
    return undefined;
    }
  }