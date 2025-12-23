/**
 * Technician Warranty Holds API
 * 
 * Get warranty holds for the logged-in technician
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // Optional filter: LOCKED, FROZEN, RELEASED, FORFEITED

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Technician profile not found" },
        { status: 404 }
      );
    }

    const where: any = {
      technicianId: technician.id,
    };

    if (status) {
      where.status = status;
    }

    const warrantyHolds = await prisma.warrantyHold.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
            status: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate summary
    const summary = {
      total: warrantyHolds.length,
      locked: warrantyHolds.filter((w) => w.status === "LOCKED").length,
      frozen: warrantyHolds.filter((w) => w.status === "FROZEN").length,
      released: warrantyHolds.filter((w) => w.status === "RELEASED").length,
      forfeited: warrantyHolds.filter((w) => w.status === "FORFEITED").length,
      totalHoldAmount: warrantyHolds
        .filter((w) => w.status === "LOCKED" || w.status === "FROZEN")
        .reduce((sum, w) => sum + w.holdAmount, 0),
      totalReleasedAmount: warrantyHolds
        .filter((w) => w.status === "RELEASED")
        .reduce((sum, w) => sum + w.holdAmount, 0),
    };

    return NextResponse.json({
      warrantyHolds,
      summary,
    });
  } catch (error: any) {
    console.error("Error fetching warranty holds:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch warranty holds" },
      { status: 500 }
    );
  }
}





