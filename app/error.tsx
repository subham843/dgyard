"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Suppress harmless removeChild errors from Radix UI
    if (
      error.message?.includes("removeChild") &&
      error.message?.includes("not a child")
    ) {
      // Silently ignore - this is a known Radix UI dialog cleanup issue
      // Auto-reset to clear the error
      setTimeout(() => reset(), 100);
      return;
    }
    console.error(error);
  }, [error, reset]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-lavender-soft">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-dark-blue mb-4">
          Something went wrong!
        </h1>
        <p className="text-light-gray mb-8">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}



