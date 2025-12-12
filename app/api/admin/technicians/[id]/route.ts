import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";

/**
 * Update technician (admin only)
 */
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
    const { active, employeeId, specialization, experience } = data;

    const updateData: any = {};
    if (active !== undefined) updateData.active = active;
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (experience !== undefined) updateData.experience = parseInt(experience);

    const technician = await prisma.technician.update({
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

    // Notify technician if status changed
    if (active !== undefined) {
      await sendNotification({
        userId: technician.userId,
        type: active ? "technician_activated" : "technician_deactivated",
        title: active ? "Account Activated" : "Account Deactivated",
        message: active
          ? "Your technician account has been activated. You can now access the technician dashboard."
          : "Your technician account has been deactivated. Please contact admin for more information.",
        channels: ["EMAIL", "IN_APP"],
      });
    }

    return NextResponse.json({ technician });
  } catch (error: any) {
    console.error("Error updating technician:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update technician" },
      { status: 500 }
    );
  }
}

/**
 * Delete technician (admin only)
 */
export async function DELETE(
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

    const technician = await prisma.technician.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Technician not found" },
        { status: 404 }
      );
    }

    // Delete technician profile (user will remain but role can be changed)
    await prisma.technician.delete({
      where: { id: params.id },
    });

    // Optionally update user role back to USER
    await prisma.user.update({
      where: { id: technician.userId },
      data: { role: "USER" },
    });

    return NextResponse.json({ success: true, message: "Technician deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting technician:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete technician" },
      { status: 500 }
    );
  }
}
