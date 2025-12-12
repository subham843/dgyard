import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Email Queue
export const emailQueue = new Queue("email", { connection });

// Notification Queue
export const notificationQueue = new Queue("notification", { connection });

// Order Processing Queue
export const orderQueue = new Queue("order", { connection });

// Worker for processing emails
export const emailWorker = new Worker(
  "email",
  async (job) => {
    const { sendEmail } = await import("@/lib/email");
    const emailOptions = job.data; // job.data contains { to, subject, html }
    const result = await sendEmail(emailOptions);
    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }
    return result;
  },
  { connection }
);

// Worker for processing notifications
export const notificationWorker = new Worker(
  "notification",
  async (job) => {
    const { prisma } = await import("@/lib/prisma");
    const { sendEmail } = await import("@/lib/email");
    const { notificationId, channel, userId, bookingId, title, message, metadata } = job.data;

    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true, name: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      let result: any = { success: true };

      switch (channel) {
        case "EMAIL":
          if (user.email) {
            const emailResult = await sendEmail({
              to: user.email,
              subject: title,
              html: message,
            });
            result = emailResult;
          }
          break;

        case "SMS":
          // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
          console.log(`SMS to ${user.phone}: ${message}`);
          result = { success: true, message: "SMS queued (not implemented)" };
          break;

        case "WHATSAPP":
          // TODO: Integrate with WhatsApp Business API
          console.log(`WhatsApp to ${user.phone}: ${message}`);
          result = { success: true, message: "WhatsApp queued (not implemented)" };
          break;

        case "IN_APP":
          // In-app notifications are already created in the database
          result = { success: true, message: "In-app notification created" };
          break;

        default:
          throw new Error(`Unknown notification channel: ${channel}`);
      }

      // Update notification status
      if (result.success) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: "SENT",
            sentAt: new Date(),
          },
        });
      } else {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: "FAILED",
          },
        });
      }

      return result;
    } catch (error: any) {
      console.error("Error processing notification:", error);
      
      // Mark notification as failed
      try {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: "FAILED",
          },
        });
      } catch (updateError) {
        console.error("Error updating notification status:", updateError);
      }

      throw error;
    }
  },
  { connection }
);

// Worker for processing orders
export const orderWorker = new Worker(
  "order",
  async (job) => {
    const { prisma } = await import("@/lib/prisma");
    const { orderId, action } = job.data;
    
    try {
      if (action === "update_stock") {
        // Update product stock after order confirmation
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });

        if (order) {
          for (const item of order.items) {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }
      }
      
      return { success: true, message: "Order processed" };
    } catch (error) {
      console.error("Error processing order:", error);
      throw error;
    }
  },
  { connection }
);



