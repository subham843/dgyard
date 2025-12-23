"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface AIFormHelperProps {
  fieldName: string;
  currentValue: string;
  context?: Record<string, any>;
  onSuggestionSelect: (suggestion: string) => void;
  enabled?: boolean;
}

export function AIFormHelper({
  fieldName,
  currentValue,
  context = {},
  onSuggestionSelect,
  enabled = true,
}: AIFormHelperProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const getSuggestions = async () => {
    if (!enabled || !currentValue || currentValue.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Call AI chat API to get form suggestions
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Suggest values for the "${fieldName}" field. Current value: "${currentValue}". Context: ${JSON.stringify(context)}. Provide 3-5 concise suggestions. Format as a simple comma-separated list.`,
          language: "en-IN",
        }),
      });

      const data = await response.json();
      
      if (data.response) {
        // Parse suggestions from AI response
        const parsed = data.response
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
          .slice(0, 5);
        setSuggestions(parsed);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      // Don't show error toast for AI suggestions - it's not critical
    } finally {
      setLoading(false);
    }
  };

  // Debounce suggestions
  useEffect(() => {
    if (!enabled || !currentValue || currentValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      getSuggestions();
    }, 500);

    return () => clearTimeout(timer);
  }, [currentValue, fieldName, enabled]);

  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionSelect(suggestion);
    setShowSuggestions(false);
    toast.success("Suggestion applied!");
  };

  if (!enabled || suggestions.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-semibold text-yellow-900">
                Honey AI Suggestions
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                Getting suggestions...
              </div>
            ) : (
              suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs h-7 bg-white hover:bg-yellow-100 border-yellow-300"
                >
                  {suggestion}
                </Button>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}












