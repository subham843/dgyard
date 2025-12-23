"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle2, AlertCircle, DollarSign, Briefcase, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export function DealerNotifications({ onNotificationRead }: { onNotificationRead?: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?unreadOnly=false&channel=IN_APP");
      if (response.ok) {
        const data = await response.json();
        const notifications = data.notifications || [];
        setNotifications(notifications);
        const unread = notifications.filter((n: any) => n.status !== "READ").length;
        setUnreadCount(unread);
        console.log("Fetched notifications:", notifications.length, "Unread:", unread);
      } else {
        console.error("Failed to fetch notifications:", response.status);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });

      if (response.ok) {
        fetchNotifications();
        // Notify parent component to refresh unread count
        if (onNotificationRead) {
          onNotificationRead();
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter((n) => n.status !== "READ")
          .map((n) => markAsRead(n.id))
      );
      toast.success("All notifications marked as read");
      fetchNotifications();
      // Notify parent component to refresh unread count
      if (onNotificationRead) {
        onNotificationRead();
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "JOB_BID_RECEIVED":
      case "JOB_COUNTER_OFFER":
        return DollarSign;
      case "JOB_ACCEPTED":
      case "JOB_COMPLETED":
        return Briefcase;
      case "WARRanty_EXPIRING":
      case "WARRANTY_ISSUE_REPORTED":
        return Shield;
      case "DISPUTE_RAISED":
      case "DISPUTE_UPDATED":
        return AlertCircle;
      default:
        return Bell;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-gray-600">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Notifications</h2>
          <p className="text-sm text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const isUnread = notification.status !== "READ";

            return (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  isUnread ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    isUnread ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold mb-1">{notification.title}</h3>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {isUnread && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



