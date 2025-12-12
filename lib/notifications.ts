import { prisma } from "@/lib/prisma";
import { notificationQueue } from "@/lib/queue";
import { sendEmail } from "@/lib/email";

export interface NotificationData {
  userId: string;
  bookingId?: string;
  type: string;
  title: string;
  message: string;
  channels: ("EMAIL" | "SMS" | "WHATSAPP" | "IN_APP")[];
  metadata?: any;
}

/**
 * Create and send notifications across multiple channels
 */
export async function sendNotification(data: NotificationData) {
  try {
    const notifications = [];

    for (const channel of data.channels) {
      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          bookingId: data.bookingId,
          type: data.type,
          title: data.title,
          message: data.message,
          channel: channel,
          status: "PENDING",
          metadata: data.metadata || {},
        },
      });

      notifications.push(notification);

      // Queue notification for processing
      await notificationQueue.add(
        `notification-${channel.toLowerCase()}`,
        {
          notificationId: notification.id,
          channel,
          userId: data.userId,
          bookingId: data.bookingId,
          title: data.title,
          message: data.message,
          metadata: data.metadata,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        }
      );
    }

    return { success: true, notifications };
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to multiple users (e.g., customer, admin, technician)
 */
export async function sendNotificationsToUsers(
  userIds: string[],
  data: Omit<NotificationData, "userId">
) {
  const results = [];
  for (const userId of userIds) {
    const result = await sendNotification({ ...data, userId });
    results.push(result);
  }
  return results;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: userId, // Ensure user owns the notification
      },
      data: {
        status: "READ",
        readAt: new Date(),
      },
    });
    return { success: true, notification };
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }
) {
  try {
    const where: any = { userId };
    if (options?.unreadOnly) {
      where.status = { not: "READ" };
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            serviceType: true,
          },
        },
      },
    });

    const total = await prisma.notification.count({ where });

    return { success: true, notifications, total };
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: error.message };
  }
}
