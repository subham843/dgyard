"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bell,
  Mail,
  MessageSquare,
  Phone,
  CheckCircle2,
  X,
  AlertCircle,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  channel: string;
  status: string;
  readAt: string | null;
  createdAt: string;
  booking?: {
    id: string;
    bookingNumber: string;
    status: string;
    serviceType: string;
  };
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?unreadOnly=false&limit=50");
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: Notification) => n.status !== "READ").length || 0);
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
        method: "PATCH",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, status: "READ", readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => n.status !== "READ");
      await Promise.all(
        unreadNotifications.map((n) =>
          fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" })
        )
      );
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: "READ", readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const getNotificationIcon = (channel: string, type: string) => {
    switch (channel) {
      case "EMAIL":
        return <Mail className="w-4 h-4" />;
      case "SMS":
      case "WHATSAPP":
        return <Phone className="w-4 h-4" />;
      case "IN_APP":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    if (type.includes("completed") || type.includes("confirmed")) {
      return "text-green-600 bg-green-50";
    }
    if (type.includes("rejected") || type.includes("cancelled")) {
      return "text-red-600 bg-red-50";
    }
    if (type.includes("assigned") || type.includes("updated")) {
      return "text-blue-600 bg-blue-50";
    }
    return "text-gray-600 bg-gray-50";
  };

  const unreadNotifications = notifications.filter((n) => n.status !== "READ");
  const readNotifications = notifications.filter((n) => n.status === "READ");

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setShowModal(true)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Notifications</DialogTitle>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </div>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Unread Notifications */}
              {unreadNotifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Unread</h3>
                  <div className="space-y-2">
                    {unreadNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        getIcon={getNotificationIcon}
                        getColor={getNotificationColor}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Read Notifications */}
              {readNotifications.length > 0 && (
                <div className={unreadNotifications.length > 0 ? "mt-6" : ""}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Read</h3>
                  <div className="space-y-2">
                    {readNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        getIcon={getNotificationIcon}
                        getColor={getNotificationColor}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
  getIcon,
  getColor,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  getIcon: (channel: string, type: string) => React.ReactNode;
  getColor: (type: string) => string;
}) {
  const isUnread = notification.status !== "READ";

  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
        isUnread ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
      }`}
      onClick={() => {
        if (isUnread) {
          onMarkAsRead(notification.id);
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${getColor(notification.type)}`}>
          {getIcon(notification.channel, notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={`font-semibold ${isUnread ? "text-gray-900" : "text-gray-700"}`}>
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              {notification.booking && (
                <div className="mt-2 text-xs text-gray-500">
                  Booking: {notification.booking.bookingNumber} - {notification.booking.serviceType}
                </div>
              )}
              <div className="text-xs text-gray-400 mt-2">
                {formatDate(notification.createdAt)}
              </div>
            </div>
            {isUnread && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
