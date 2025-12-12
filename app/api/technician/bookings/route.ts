import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get bookings assigned to technician
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is technician
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "TECHNICIAN") {
      return NextResponse.json(
        { error: "Only technicians can access this endpoint" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = { assignedTo: session.user.id };
    if (status && status !== "all") {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        logs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        updates: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching technician bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
