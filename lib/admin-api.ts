/**
 * Utility functions for making authenticated admin API calls
 */

interface FetchOptions extends RequestInit {
  body?: any;
}

export async function adminFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { body, headers, ...restOptions } = options;

  const fetchHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  const fetchOptions: RequestInit = {
    ...restOptions,
    headers: fetchHeaders,
    credentials: "include", // Always include credentials for session cookies
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  return fetch(url, fetchOptions);
}

export async function handleApiResponse<T = any>(
  response: Response
): Promise<{ data?: T; error?: string }> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  let data: any;
  try {
    data = isJson ? await response.json() : await response.text();
  } catch (error) {
    console.error("Failed to parse response:", error);
    return {
      error: `Failed to parse response (Status: ${response.status})`,
    };
  }

  if (!response.ok) {
    console.error("API Error:", {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      error: data?.error || data,
    });
    return {
      error: data?.error || data || `Request failed (Status: ${response.status})`,
    };
  }

  return { data };
}

