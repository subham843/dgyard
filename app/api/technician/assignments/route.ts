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

    // Get technician profile
    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Technician profile not found" },
        { status: 404 }
      );
    }

    const where: any = { assignedTechnicianId: technician.id };
    if (status && status !== "all") {
      where.status = status;
    }

    const assignments = await prisma.jobPost.findMany({
      where,
      include: {
        dealer: {
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
            fullName: true,
            mobile: true,
            email: true,
          },
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




