/**
 * Technician Withdrawals API
 * 
 * Get withdrawals for the logged-in technician
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
    const status = searchParams.get("status"); // Optional filter

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

    const withdrawals = await prisma.withdrawal.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate summary
    const summary = {
      total: withdrawals.length,
      pending: withdrawals.filter((w) => w.status === "PENDING").length,
      approved: withdrawals.filter((w) => w.status === "APPROVED").length,
      processing: withdrawals.filter((w) => w.status === "PROCESSING").length,
      completed: withdrawals.filter((w) => w.status === "COMPLETED").length,
      rejected: withdrawals.filter((w) => w.status === "REJECTED").length,
      failed: withdrawals.filter((w) => w.status === "FAILED").length,
      totalPendingAmount: withdrawals
        .filter((w) => ["PENDING", "APPROVED", "PROCESSING"].includes(w.status))
        .reduce((sum, w) => sum + w.amount, 0),
      totalCompletedAmount: withdrawals
        .filter((w) => w.status === "COMPLETED")
        .reduce((sum, w) => sum + w.amount, 0),
    };

    return NextResponse.json({
      withdrawals,
      summary,
    });
  } catch (error: any) {
    console.error("Error fetching withdrawals:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}





