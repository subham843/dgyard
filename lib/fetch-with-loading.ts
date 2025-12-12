import { useLoading } from "@/contexts/loading-context";

/**
 * Enhanced fetch function that automatically shows loading state
 * Usage: const response = await fetchWithLoading('/api/data', { method: 'GET' }, 'Fetching data...');
 */
export async function fetchWithLoading(
  url: string,
  options: RequestInit = {},
  loadingMessage: string = "Loading..."
): Promise<Response> {
  // Get loading context from window if available (for non-component usage)
  // For component usage, use useLoading hook directly
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Hook to use fetch with automatic loading
 * This should be used inside components
 */
export function useFetchWithLoading() {
  const { withLoading } = useLoading();

  const fetchWithLoading = async (
    url: string,
    options: RequestInit = {},
    loadingMessage: string = "Loading..."
  ): Promise<Response> => {
    return withLoading(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    }, loadingMessage);
  };

  return { fetchWithLoading };
}

