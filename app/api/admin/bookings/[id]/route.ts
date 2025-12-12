import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { sendNotification, sendNotificationsToUsers } from "@/lib/notifications";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          include: {
            booking: {
              select: {
                bookingNumber: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const action = data.action; // accept, reject, schedule, assign, update_status, close

    // Get current booking state
    const currentBooking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        technician: true,
      },
    });

    if (!currentBooking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    let activityDescription = "";
    let notificationTitle = "";
    let notificationMessage = "";
    const notifyUserIds: string[] = [currentBooking.userId];

    // Handle different actions
    switch (action) {
      case "accept":
        updateData.status = "CONFIRMED";
        activityDescription = `Booking accepted by admin`;
        notificationTitle = "Booking Confirmed";
        notificationMessage = `Your booking ${currentBooking.bookingNumber} has been confirmed.`;
        break;

      case "reject":
        updateData.status = "REJECTED";
        updateData.notes = data.reason || currentBooking.notes || "Booking rejected";
        activityDescription = `Booking rejected by admin. Reason: ${data.reason || "Not specified"}`;
        notificationTitle = "Booking Rejected";
        notificationMessage = `Your booking ${currentBooking.bookingNumber} has been rejected. ${data.reason ? `Reason: ${data.reason}` : ""}`;
        break;

      case "schedule":
        if (!data.scheduledAt) {
          return NextResponse.json(
            { error: "scheduledAt is required" },
            { status: 400 }
          );
        }
        updateData.scheduledAt = new Date(data.scheduledAt);
        updateData.status = data.status || currentBooking.status;
        activityDescription = `Booking scheduled for ${new Date(data.scheduledAt).toLocaleString()}`;
        notificationTitle = "Booking Scheduled";
        notificationMessage = `Your booking ${currentBooking.bookingNumber} has been scheduled for ${new Date(data.scheduledAt).toLocaleString()}.`;
        break;

      case "assign":
        if (!data.assignedTo) {
          return NextResponse.json(
            { error: "assignedTo is required" },
            { status: 400 }
          );
        }
        // Verify technician exists
        const technician = await prisma.user.findUnique({
          where: { id: data.assignedTo },
          include: { technicianProfile: true },
        });

        if (!technician || technician.role !== "TECHNICIAN") {
          return NextResponse.json(
            { error: "Invalid technician" },
            { status: 400 }
          );
        }

        updateData.assignedTo = data.assignedTo;
        updateData.status = data.status || "IN_PROGRESS";
        activityDescription = `Technician assigned: ${technician.name || technician.email}`;
        notificationTitle = "Technician Assigned";
        notificationMessage = `A technician has been assigned to your booking ${currentBooking.bookingNumber}.`;
        notifyUserIds.push(data.assignedTo); // Notify technician too
        break;

      case "update_status":
        if (!data.status) {
          return NextResponse.json(
            { error: "status is required" },
            { status: 400 }
          );
        }
        updateData.status = data.status;
        activityDescription = `Status updated to ${data.status}`;
        notificationTitle = "Booking Status Updated";
        notificationMessage = `Your booking ${currentBooking.bookingNumber} status has been updated to ${data.status}.`;
        break;

      case "close":
        updateData.status = "COMPLETED";
        updateData.completedAt = new Date();
        if (data.actualCost !== undefined) {
          updateData.actualCost = data.actualCost;
        }
        activityDescription = `Booking closed and marked as completed`;
        notificationTitle = "Booking Completed";
        notificationMessage = `Your booking ${currentBooking.bookingNumber} has been completed.`;
        break;

      default:
        // Generic update
        if (data.status) updateData.status = data.status;
        if (data.priority) updateData.priority = data.priority;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
        if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
        if (data.completedAt) updateData.completedAt = new Date(data.completedAt);
        if (data.estimatedCost !== undefined) updateData.estimatedCost = data.estimatedCost;
        if (data.actualCost !== undefined) updateData.actualCost = data.actualCost;
        activityDescription = "Booking updated";
        notificationTitle = "Booking Updated";
        notificationMessage = `Your booking ${currentBooking.bookingNumber} has been updated.`;
    }

    // Update booking
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Create activity log
    await createActivityLog({
      bookingId: params.id,
      userId: session.user.id,
      action: action || "update",
      description: activityDescription,
      oldValue: {
        status: currentBooking.status,
        assignedTo: currentBooking.assignedTo,
        scheduledAt: currentBooking.scheduledAt,
      },
      newValue: {
        status: booking.status,
        assignedTo: booking.assignedTo,
        scheduledAt: booking.scheduledAt,
      },
    });

    // Send notifications
    await sendNotificationsToUsers(notifyUserIds, {
      bookingId: params.id,
      type: `booking_${action || "updated"}`,
      title: notificationTitle,
      message: notificationMessage,
      channels: ["EMAIL", "IN_APP"],
      metadata: {
        bookingNumber: booking.bookingNumber,
        status: booking.status,
      },
    });

    return NextResponse.json({ booking });
  } catch (error: any) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update booking" },
      { status: 500 }
    );
  }
}




















