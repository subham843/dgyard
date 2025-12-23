"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface AIFormHelperButtonProps {
  fieldName: string;
  currentValue: string;
  context?: Record<string, any>;
  onSuggestionSelect: (suggestion: string) => void;
  enabled?: boolean;
}

export function AIFormHelperButton({
  fieldName,
  currentValue,
  context = {},
  onSuggestionSelect,
  enabled = true,
}: AIFormHelperButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const getSuggestions = async () => {
    if (!enabled) {
      toast.error("AI suggestions are not available");
      return;
    }

    setLoading(true);
    setShowSuggestions(true);

    try {
      // Build context string
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");

      // Call AI chat API to get form suggestions
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `I'm filling a dealer registration form. For the "${fieldName}" field, current value is "${currentValue}". ${contextStr ? `Context: ${contextStr}.` : ""} Suggest 3-5 appropriate values. Respond with only a comma-separated list of suggestions, nothing else.`,
          language: "en-IN",
        }),
      });

      const data = await response.json();
      
      if (data.response) {
        // Parse suggestions from AI response
        const parsed = data.response
          .split(/[,\n]/)
          .map((s: string) => s.trim().replace(/^[-•*]\s*/, ""))
          .filter((s: string) => s.length > 0 && s.length < 100)
          .slice(0, 5);
        
        if (parsed.length > 0) {
          setSuggestions(parsed);
        } else {
          toast.error("No suggestions available. Please fill manually.");
          setShowSuggestions(false);
        }
      } else {
        toast.error("Could not get AI suggestions");
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      toast.error("Error getting AI suggestions");
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionSelect(suggestion);
    setShowSuggestions(false);
    toast.success("Suggestion applied!");
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={getSuggestions}
        disabled={loading}
        className="text-xs"
      >
        {loading ? (
          <>
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Thinking...
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3 mr-1" />
            Ask Honey
          </>
        )}
      </Button>

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full mt-2 left-0 z-50 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-semibold text-gray-900">
                Suggestions for {fieldName}
              </span>
            </div>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-yellow-50 rounded transition-colors border border-transparent hover:border-yellow-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}












