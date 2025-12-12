import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get all assignments for the logged-in technician
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is a technician
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { technicianProfile: true },
    });

    if (!user || user.role !== "TECHNICIAN") {
      return NextResponse.json(
        { error: "Access denied. Technician role required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = { assignedTo: session.user.id };
    if (status && status !== "all") {
      where.status = status;
    }

    const assignments = await prisma.booking.findMany({
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
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: [
        { priority: "desc" },
        { scheduledAt: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ assignments });
  } catch (error: any) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}
