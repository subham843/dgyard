import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get jobs with active warranties
    const warranties = await prisma.warranty.findMany({
      where: {
        status: "ACTIVE",
        endDate: { gt: now },
      },
      include: {
        job: {
          include: {
            technician: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { endDate: "asc" },
    });

    const warrantyData = warranties.map((warranty) => {
      const daysRemaining = Math.ceil(
        (new Date(warranty.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: warranty.id,
        jobId: warranty.jobId,
        jobNumber: warranty.job.jobNumber,
        customerName: warranty.job.customerName || "Unknown",
        technicianName: warranty.job.technician?.user?.name || "Unknown",
        serviceType: warranty.job.title || "General",
        warrantyEndsAt: warranty.endDate,
        daysRemaining,
        status: warranty.status,
        claimCount: warranty.status === "ISSUE_REPORTED" ? 1 : 0,
      };
    });

    const activeWarranties = warrantyData.filter((w) => w.status === "ACTIVE").length;
    const expiringSoon = warrantyData.filter((w) => w.daysRemaining <= 7 && w.daysRemaining > 0).length;

    return NextResponse.json({
      warranties: warrantyData,
      stats: {
        activeWarranties,
        expiringSoon,
        openDisputes: 0,
        totalHoldAmount: 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching warranties:", error);
    return NextResponse.json(
      { error: "Failed to fetch warranties", details: error.message },
      { status: 500 }
    );
  }
}

