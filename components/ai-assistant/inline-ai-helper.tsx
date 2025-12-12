"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, X, MessageCircle, Lightbulb } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface InlineAIHelperProps {
  context: string;
  suggestions?: string[];
  position?: "top" | "bottom" | "inline";
}

export function InlineAIHelper({ context, suggestions, position = "top" }: InlineAIHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  // Don't show on admin pages (already has chatbot)
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleAskHoney = async () => {
    // Check auth before opening
    if (sessionStatus === "loading") {
      return;
    }

    if (sessionStatus === "unauthenticated" || !session?.user?.id) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    // Check profile completion
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        const user = data.user;
        
        const profileComplete = !!(user?.name && user?.email && user?.phone);
        const phoneVerified = user?.phoneVerified === true;

        if (!profileComplete) {
          router.push(`/dashboard/profile?callbackUrl=${encodeURIComponent(pathname || "/")}&action=complete`);
          return;
        }

        if (!phoneVerified) {
          router.push(`/dashboard/profile?callbackUrl=${encodeURIComponent(pathname || "/")}&action=verify-phone`);
          return;
        }

        // All checks passed - open chatbot
        const event = new CustomEvent("openHoneyChat", {
          detail: { message: `Help me with ${context}` },
        });
        window.dispatchEvent(event);
      } else {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    // Check auth before opening
    if (sessionStatus === "loading") {
      return;
    }

    if (sessionStatus === "unauthenticated" || !session?.user?.id) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    // Check profile completion
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        const user = data.user;
        
        const profileComplete = !!(user?.name && user?.email && user?.phone);
        const phoneVerified = user?.phoneVerified === true;

        if (!profileComplete) {
          router.push(`/dashboard/profile?callbackUrl=${encodeURIComponent(pathname || "/")}&action=complete`);
          return;
        }

        if (!phoneVerified) {
          router.push(`/dashboard/profile?callbackUrl=${encodeURIComponent(pathname || "/")}&action=verify-phone`);
          return;
        }

        // All checks passed - open chatbot with suggestion
        const event = new CustomEvent("openHoneyChat", {
          detail: { message: suggestion },
        });
        window.dispatchEvent(event);
      } else {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
    }
  };

  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`${
            position === "top" ? "mb-4" : position === "bottom" ? "mt-4" : "my-4"
          }`}
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900">Honey can help!</h4>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Need help with {context}? Ask Honey for instant guidance, step-by-step assistance, and smart recommendations.
              </p>
              {suggestions && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs bg-white border border-blue-200 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              <Button
                size="sm"
                onClick={handleAskHoney}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Ask Honey
              </Button>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

