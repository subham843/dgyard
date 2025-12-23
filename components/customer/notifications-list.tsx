"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wrench,
  Package,
  CreditCard,
  Shield,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    bookingNumber?: string;
    orderNumber?: string;
    [key: string]: any;
  };
}

export function NotificationsList() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications");
      const data = await response.json();
      
      if (response.ok) {
        const notifs = data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: Notification) => !n.read).length);
      } else {
        toast.error("Failed to load notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Something went wrong");
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
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
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
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      await Promise.all(
        unreadIds.map((id) =>
          fetch(`/api/notifications/${id}/read`, { method: "POST" })
        )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      booking_created: Wrench,
      booking_assigned: Wrench,
      booking_completed: CheckCircle2,
      order_placed: Package,
      order_shipped: Package,
      order_delivered: Package,
      payment_received: CreditCard,
      payment_failed: CreditCard,
      warranty_expiring: Shield,
      warranty_expired: Shield,
      complaint_created: AlertCircle,
      complaint_resolved: CheckCircle2,
    };
    return iconMap[type] || Bell;
  };

  const getNotificationColor = (type: string) => {
    if (type.includes("completed") || type.includes("resolved") || type.includes("delivered")) {
      return "text-green-600 bg-green-100";
    }
    if (type.includes("failed") || type.includes("expired") || type.includes("complaint")) {
      return "text-red-600 bg-red-100";
    }
    if (type.includes("expiring")) {
      return "text-yellow-600 bg-yellow-100";
    }
    return "text-blue-600 bg-blue-100";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications & Alerts</h1>
            <p className="text-gray-600">Stay updated with your services and orders</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark All as Read
            </Button>
          )}
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-red-500 text-white">
            {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-gray-600">You're all caught up!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const isUnread = !notification.read;
            
            return (
              <Card
                key={notification.id}
                className={`hover:shadow-lg transition-all ${
                  isUnread ? "border-l-4 border-l-blue-500 bg-blue-50" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <h4 className={`font-semibold ${isUnread ? "text-blue-900" : "text-gray-900"}`}>
                            {notification.title}
                          </h4>
                          {isUnread && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full inline-block ml-2"></div>
                          )}
                        </div>
                        {isUnread && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="ml-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className={`text-sm ${isUnread ? "text-blue-800" : "text-gray-600"} mb-2`}>
                        {notification.message}
                      </p>
                      {notification.metadata?.bookingNumber && (
                        <p className="text-xs text-gray-500">
                          Booking: {notification.metadata.bookingNumber}
                        </p>
                      )}
                      {notification.metadata?.orderNumber && (
                        <p className="text-xs text-gray-500">
                          Order: {notification.metadata.orderNumber}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}





