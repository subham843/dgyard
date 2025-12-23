"use client";

import { useEffect, useCallback, useRef } from "react";

interface UseRealtimeNotificationsOptions {
  interval?: number; // Polling interval in milliseconds
  enabled?: boolean;
  onUpdate?: () => void;
}

export function useRealtimeNotifications({
  interval = 30000, // 30 seconds default
  enabled = true,
  onUpdate,
}: UseRealtimeNotificationsOptions = {}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const poll = useCallback(() => {
    if (!enabled || !isMountedRef.current) return;

    // Trigger update callback
    if (onUpdate) {
      onUpdate();
    }
  }, [enabled, onUpdate]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial poll
    poll();

    // Set up polling interval
    intervalRef.current = setInterval(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, poll]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    refresh: poll,
  };
}





