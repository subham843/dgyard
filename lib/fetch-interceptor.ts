/**
 * Global fetch interceptor to automatically show loading state
 * This intercepts all fetch calls and shows/hides the loader
 */

let loadingCount = 0;
let pendingRequests = new Set<string>();
let setLoadingCallback: ((loading: boolean, message?: string) => void) | null = null;
let pageLoadTimeout: NodeJS.Timeout | null = null;
let isPageLoaded = false;

export function registerLoadingCallback(callback: (loading: boolean, message?: string) => void) {
  setLoadingCallback = callback;
}

export function unregisterLoadingCallback() {
  setLoadingCallback = null;
}

function showLoading(message: string = "Loading...") {
  loadingCount++;
  if (setLoadingCallback) {
    // Use setTimeout to avoid calling setState during render phase
    setTimeout(() => {
      if (setLoadingCallback) {
        setLoadingCallback(true, message);
      }
    }, 0);
  }
}

function hideLoading(requestId?: string) {
  if (requestId) {
    pendingRequests.delete(requestId);
  }
  
  loadingCount--;
  if (loadingCount <= 0) {
    loadingCount = 0;
    // Clear all pending requests
    pendingRequests.clear();
    
    // Ensure loader is hidden after a short delay
    // Use setTimeout to avoid calling setState during render phase
    setTimeout(() => {
      if (setLoadingCallback && loadingCount === 0) {
        setLoadingCallback(false);
      }
    }, 100);
  }
}

// Force hide loader (for page load completion)
function forceHideLoading() {
  loadingCount = 0;
  pendingRequests.clear();
  if (setLoadingCallback) {
    // Use setTimeout to avoid calling setState during render phase
    setTimeout(() => {
      if (setLoadingCallback) {
        setLoadingCallback(false);
      }
    }, 0);
  }
}

// Intercept fetch globally
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;

  window.fetch = async function (...args: Parameters<typeof fetch>): Promise<Response> {
    // Safely extract URL from fetch arguments
    let url: string | undefined;
    if (typeof args[0] === "string") {
      url = args[0];
    } else if (args[0] && typeof args[0] === "object" && "url" in args[0]) {
      url = args[0].url;
    } else if (args[0] instanceof URL) {
      url = args[0].href;
    } else if (args[0] instanceof Request) {
      url = args[0].url;
    }
    
    const options = args[1] || {};
    const requestId = `${Date.now()}-${Math.random()}`;

    // Skip loading for certain endpoints (like analytics, images, etc.)
    const skipLoadingPatterns = [
      "/api/analytics",
      "/_next/",
      "/favicon",
      ".jpg",
      ".png",
      ".gif",
      ".svg",
      ".webp",
      ".ico",
      ".woff",
      ".woff2",
      ".ttf",
      ".eot",
    ];

    // Only check patterns if URL is defined
    const shouldSkipLoading = url ? skipLoadingPatterns.some((pattern) => url!.includes(pattern)) : false;

    if (!shouldSkipLoading) {
      pendingRequests.add(requestId);
      showLoading("Processing request...");
    }

    try {
      const response = await originalFetch.apply(this, args);
      
      if (!shouldSkipLoading) {
        // Wait for response to be fully processed
        await response.clone().text().catch(() => {});
        hideLoading(requestId);
      }
      
      return response;
    } catch (error: any) {
      if (!shouldSkipLoading) {
        hideLoading(requestId);
      }
      
      // Handle network errors gracefully - don't throw for expected failures
      // Network errors are common during development (server restart, etc.)
      if (error?.name === "TypeError" && error?.message === "Failed to fetch") {
        // Return a rejected promise with a more descriptive error
        // This allows callers to handle it gracefully
        return Promise.reject(error);
      }
      
      throw error;
    }
  };

  // Listen for page load completion
  if (document.readyState === "complete") {
    isPageLoaded = true;
    // Give some time for initial requests to complete
    setTimeout(() => {
      forceHideLoading();
    }, 2000);
  } else {
    window.addEventListener("load", () => {
      isPageLoaded = true;
      // Give some time for initial requests to complete
      setTimeout(() => {
        forceHideLoading();
      }, 2000);
    });
  }

  // Also listen for DOMContentLoaded as a fallback
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      if (isPageLoaded && loadingCount > 0) {
        // If page is loaded but loader is still showing, force hide after 3 seconds
        setTimeout(() => {
          forceHideLoading();
        }, 3000);
      }
    }, 1000);
  });

  // Safety timeout - force hide loader after 10 seconds
  setInterval(() => {
    if (loadingCount > 0 && isPageLoaded) {
      const oldestRequest = Array.from(pendingRequests)[0];
      if (oldestRequest) {
        const requestTime = parseInt(oldestRequest.split("-")[0]);
        const elapsed = Date.now() - requestTime;
        if (elapsed > 10000) {
          // Request is taking too long, force hide
          forceHideLoading();
        }
      }
    }
  }, 1000);
}

