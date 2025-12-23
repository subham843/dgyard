import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get warranties from completed jobs/bookings
    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        warrantyDays: {
          gt: 0,
        },
      },
      include: {
        assignedTechnician: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Transform to warranty format
    const warranties = bookings.map((booking) => {
      const completedAt = booking.completedAt || booking.updatedAt;
      const warrantyDays = booking.warrantyDays || 0;
      const expiresAt = new Date(completedAt);
      expiresAt.setDate(expiresAt.getDate() + warrantyDays);
      const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

      return {
        id: booking.id,
        serviceName: `${booking.serviceType} - ${booking.bookingNumber}`,
        warrantyDaysLeft: daysLeft,
        warrantyDays: warrantyDays,
        technicianName: booking.assignedTechnician?.user?.name || null,
        technicianPhone: booking.assignedTechnician?.user?.phone || null,
        expiresAt: expiresAt.toISOString(),
        completedAt: completedAt.toISOString(),
        bookingNumber: booking.bookingNumber,
        status: daysLeft > 0 ? "ACTIVE" : "EXPIRED",
      };
    });

    return NextResponse.json({ warranties });
  } catch (error) {
    console.error("Error fetching warranties:", error);
    return NextResponse.json(
      { error: "Failed to fetch warranties" },
      { status: 500 }
    );
  }
}





