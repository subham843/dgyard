"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { registerLoadingCallback, unregisterLoadingCallback } from "@/lib/fetch-interceptor";

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, message?: string) => void;
  withLoading: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  const setLoading = useCallback((loading: boolean, message: string = "Loading...") => {
    setIsLoading(loading);
    setLoadingMessage(message);
  }, []);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>, message: string = "Loading...") => {
      setIsLoading(true);
      setLoadingMessage(message);
      try {
        const result = await fn();
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Register callback for fetch interceptor
  useEffect(() => {
    registerLoadingCallback(setLoading);
    return () => {
      unregisterLoadingCallback();
    };
  }, [setLoading]);

  // Ensure loader hides after page is fully loaded
  useEffect(() => {
    const handlePageLoad = () => {
      // Wait a bit for all initial requests to complete
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 2000);
    };

    if (typeof window !== "undefined") {
      if (document.readyState === "complete") {
        handlePageLoad();
      } else {
        window.addEventListener("load", handlePageLoad);
        return () => {
          window.removeEventListener("load", handlePageLoad);
        };
      }
    }
  }, [isLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, loadingMessage, setLoading, withLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}

