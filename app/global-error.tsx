"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-lavender-soft">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-dark-blue mb-4">
              Something went wrong!
            </h1>
            <p className="text-light-gray mb-8">
              We encountered an unexpected error. Please try again.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={reset}>Try Again</Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

