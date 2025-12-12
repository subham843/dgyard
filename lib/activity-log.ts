import { prisma } from "@/lib/prisma";

export interface ActivityLogData {
  bookingId: string;
  userId?: string;
  action: string;
  description: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
}

/**
 * Create an activity log entry
 */
export async function createActivityLog(data: ActivityLogData) {
  try {
    const log = await prisma.activityLog.create({
      data: {
        bookingId: data.bookingId,
        userId: data.userId,
        action: data.action,
        description: data.description,
        oldValue: data.oldValue || null,
        newValue: data.newValue || null,
        metadata: data.metadata || {},
      },
    });
    return { success: true, log };
  } catch (error: any) {
    console.error("Error creating activity log:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get activity logs for a booking
 */
export async function getBookingActivityLogs(bookingId: string) {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            bookingNumber: true,
            status: true,
          },
        },
      },
    });
    return { success: true, logs };
  } catch (error: any) {
    console.error("Error fetching activity logs:", error);
    return { success: false, error: error.message };
  }
}
