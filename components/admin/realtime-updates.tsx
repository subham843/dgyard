"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

export function RealtimeUpdates() {
  const router = useRouter();
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    // Simulate real-time updates by polling every 30 seconds
    const interval = setInterval(() => {
      // Check for new updates
      fetch("/api/admin/updates/check")
        .then((res) => res.json())
        .then((data) => {
          if (data.hasUpdates) {
            setUpdateCount((prev) => prev + 1);
            // Optionally show notification
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Admin Panel Update", {
                body: "New data available. Click to refresh.",
                icon: "/favicon.ico",
              });
            }
          }
        })
        .catch(console.error);
    }, 30000); // Poll every 30 seconds

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setUpdateCount(0);
    router.refresh();
  };

  if (updateCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-blue-600 text-white rounded-lg shadow-lg p-4 z-50 flex items-center gap-3">
      <Bell className="w-5 h-5" />
      <div>
        <p className="font-semibold">New updates available</p>
        <p className="text-sm opacity-90">{updateCount} update(s)</p>
      </div>
      <button
        onClick={handleRefresh}
        className="ml-4 px-4 py-2 bg-white text-blue-600 rounded hover:bg-blue-50 font-semibold"
      >
        Refresh
      </button>
    </div>
  );
}

