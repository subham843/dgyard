import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Unified booking update API for admin, technician, and system
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const bookingId = params.id;

    // Get current booking
    const currentBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, technician: true },
    });

    if (!currentBooking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
    const isTechnician = session.user.role === "TECHNICIAN";
    const isOwner = currentBooking.userId === session.user.id;
    const isAssignedTechnician = currentBooking.assignedTo === session.user.id;

    // Build update data
    const updateData: any = {};
    const logEntries: any[] = [];

    // Status updates
    if (data.status) {
      if (!isAdmin && !isAssignedTechnician) {
        return NextResponse.json(
          { error: "Only admin or assigned technician can update status" },
          { status: 403 }
        );
      }
      updateData.status = data.status;
      logEntries.push({
        bookingId,
        action: "STATUS_CHANGED",
        actorId: session.user.id,
        actorType: isAdmin ? "ADMIN" : "TECHNICIAN",
        oldValue: JSON.stringify({ status: currentBooking.status }),
        newValue: JSON.stringify({ status: data.status }),
      });

      // Set timestamps based on status
      if (data.status === "COMPLETED") {
        updateData.completedAt = new Date();
      } else if (data.status === "REJECTED") {
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = data.rejectionReason || null;
      }
    }

    // Admin-only fields
    if (isAdmin) {
      if (data.assignedTo !== undefined) {
        const oldTechnician = currentBooking.assignedTo;
        updateData.assignedTo = data.assignedTo || null;
        updateData.assignedAt = data.assignedTo ? new Date() : null;
        logEntries.push({
          bookingId,
          action: "TECHNICIAN_ASSIGNED",
          actorId: session.user.id,
          actorType: "ADMIN",
          oldValue: JSON.stringify({ assignedTo: oldTechnician }),
          newValue: JSON.stringify({ assignedTo: data.assignedTo }),
        });
      }
      if (data.scheduledAt) {
        updateData.scheduledAt = new Date(data.scheduledAt);
        logEntries.push({
          bookingId,
          action: "SCHEDULED",
          actorId: session.user.id,
          actorType: "ADMIN",
          oldValue: JSON.stringify({ scheduledAt: currentBooking.scheduledAt }),
          newValue: JSON.stringify({ scheduledAt: data.scheduledAt }),
        });
      }
      if (data.priority) updateData.priority = data.priority;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.estimatedCost !== undefined) updateData.estimatedCost = data.estimatedCost;
      if (data.actualCost !== undefined) updateData.actualCost = data.actualCost;
      if (data.estimatedDuration !== undefined) updateData.estimatedDuration = data.estimatedDuration;
    }

    // Technician updates
    if (isAssignedTechnician || isTechnician) {
      if (data.technicianNotes) {
        // Create booking update
        await prisma.bookingUpdate.create({
          data: {
            bookingId,
            updateType: "NOTE",
            description: data.technicianNotes,
            createdBy: session.user.id,
            status: currentBooking.status,
          },
        });
        logEntries.push({
          bookingId,
          action: "TECHNICIAN_NOTE_ADDED",
          actorId: session.user.id,
          actorType: "TECHNICIAN",
          metadata: { note: data.technicianNotes },
        });
      }

      if (data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
        await prisma.bookingUpdate.create({
          data: {
            bookingId,
            updateType: "PHOTO",
            photos: data.photos,
            createdBy: session.user.id,
            status: currentBooking.status,
          },
        });
        logEntries.push({
          bookingId,
          action: "PHOTOS_ADDED",
          actorId: session.user.id,
          actorType: "TECHNICIAN",
          metadata: { photoCount: data.photos.length },
        });
      }

      if (data.location) {
        await prisma.bookingUpdate.create({
          data: {
            bookingId,
            updateType: "LOCATION",
            location: data.location,
            createdBy: session.user.id,
            status: currentBooking.status,
          },
        });
      }
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        user: true,
        technician: true,
        logs: { orderBy: { createdAt: "desc" }, take: 10 },
        updates: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    // Create log entries
    if (logEntries.length > 0) {
      await prisma.bookingLog.createMany({
        data: logEntries,
      });
    }

    // Send notifications (async, don't wait)
    if (data.status || data.assignedTo) {
      // Queue notifications
      try {
        const { sendBookingNotification } = await import("@/lib/notifications");
        await sendBookingNotification(updatedBooking, {
          type: data.status ? "STATUS_UPDATE" : "ASSIGNMENT",
          actorId: session.user.id,
        });
      } catch (notifError) {
        console.error("Error sending notifications:", notifError);
        // Don't fail the update if notifications fail
      }
    }

    return NextResponse.json({ booking: updatedBooking });
  } catch (error: any) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update booking" },
      { status: 500 }
    );
  }
}
