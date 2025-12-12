import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { sendNotification, sendNotificationsToUsers } from "@/lib/notifications";

/**
 * Get a specific assignment
 */
export async function GET(
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

    const assignment = await prisma.booking.findUnique({
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
        activityLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Verify technician is assigned to this booking
    if (assignment.assignedTo !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied. You are not assigned to this booking." },
        { status: 403 }
      );
    }

    return NextResponse.json({ assignment });
  } catch (error: any) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}

/**
 * Update assignment (status, notes, photos, completion)
 */
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
    const action = data.action; // update_status, add_note, upload_photos, complete

    // Get current assignment
    const currentAssignment = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        user: true,
      },
    });

    if (!currentAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Verify technician is assigned
    if (currentAssignment.assignedTo !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied. You are not assigned to this booking." },
        { status: 403 }
      );
    }

    const updateData: any = {};
    let activityDescription = "";
    let notificationTitle = "";
    let notificationMessage = "";

    switch (action) {
      case "update_status":
        if (!data.status) {
          return NextResponse.json(
            { error: "status is required" },
            { status: 400 }
          );
        }
        updateData.status = data.status;
        activityDescription = `Technician updated status to ${data.status}`;
        notificationTitle = "Assignment Status Updated";
        notificationMessage = `Technician updated the status of booking ${currentAssignment.bookingNumber} to ${data.status}.`;
        break;

      case "add_note":
        if (!data.note) {
          return NextResponse.json(
            { error: "note is required" },
            { status: 400 }
          );
        }
        const existingNotes = currentAssignment.technicianNotes || "";
        updateData.technicianNotes = existingNotes
          ? `${existingNotes}\n\n[${new Date().toLocaleString()}] ${data.note}`
          : `[${new Date().toLocaleString()}] ${data.note}`;
        activityDescription = `Technician added note: ${data.note.substring(0, 100)}`;
        notificationTitle = "Technician Note Added";
        notificationMessage = `Technician added a note to booking ${currentAssignment.bookingNumber}.`;
        break;

      case "upload_photos":
        if (!data.photos || !Array.isArray(data.photos) || data.photos.length === 0) {
          return NextResponse.json(
            { error: "photos array is required" },
            { status: 400 }
          );
        }
        const existingPhotos = currentAssignment.photos || [];
        updateData.photos = [...existingPhotos, ...data.photos];
        activityDescription = `Technician uploaded ${data.photos.length} photo(s)`;
        notificationTitle = "Photos Uploaded";
        notificationMessage = `Technician uploaded ${data.photos.length} photo(s) for booking ${currentAssignment.bookingNumber}.`;
        break;

      case "complete":
        updateData.status = "COMPLETED";
        updateData.completedAt = new Date();
        if (data.completionNotes) {
          const existingNotes = currentAssignment.technicianNotes || "";
          updateData.technicianNotes = existingNotes
            ? `${existingNotes}\n\n[${new Date().toLocaleString()}] Completion: ${data.completionNotes}`
            : `[${new Date().toLocaleString()}] Completion: ${data.completionNotes}`;
        }
        activityDescription = `Technician marked assignment as completed`;
        notificationTitle = "Assignment Completed";
        notificationMessage = `Technician has completed booking ${currentAssignment.bookingNumber}.`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update assignment
    const assignment = await prisma.booking.update({
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
      },
    });

    // Create activity log
    await createActivityLog({
      bookingId: params.id,
      userId: session.user.id,
      action: action,
      description: activityDescription,
      oldValue: {
        status: currentAssignment.status,
        photos: currentAssignment.photos?.length || 0,
      },
      newValue: {
        status: assignment.status,
        photos: assignment.photos?.length || 0,
      },
      metadata: {
        action,
        ...(data.note && { note: data.note }),
        ...(data.photos && { photoCount: data.photos.length }),
      },
    });

    // Send notifications to customer and admin
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    const notifyUserIds = [
      currentAssignment.userId,
      ...adminUsers.map((admin) => admin.id),
    ];

    await sendNotificationsToUsers(notifyUserIds, {
      bookingId: params.id,
      type: `technician_${action}`,
      title: notificationTitle,
      message: notificationMessage,
      channels: ["EMAIL", "IN_APP"],
      metadata: {
        bookingNumber: assignment.bookingNumber,
        status: assignment.status,
        technicianId: session.user.id,
      },
    });

    return NextResponse.json({ assignment });
  } catch (error: any) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update assignment" },
      { status: 500 }
    );
  }
}
