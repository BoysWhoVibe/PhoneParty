import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Clone the response so we can try multiple parsing methods
    const resClone = res.clone();
    
    try {
      // Try to parse JSON error response first
      const errorData = await res.json();
      if (errorData && errorData.message) {
        const error = new Error(errorData.message);
        (error as any).status = res.status;
        throw error;
      }
    } catch (jsonError) {
      // JSON parsing failed, try text parsing on the cloned response
      try {
        const text = await resClone.text();
        if (text) {
          throw new Error(text);
        }
      } catch (textError) {
        // Both parsing methods failed, use status text
        throw new Error(res.statusText || `HTTP ${res.status}`);
      }
    }
    
    // Fallback if no error message was found
    throw new Error(res.statusText || `HTTP ${res.status}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
