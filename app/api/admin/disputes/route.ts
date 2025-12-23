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

    // Fetch disputes
    const disputes = await prisma.dispute?.findMany({
      where: {
        status: { in: ["OPEN", "UNDER_REVIEW"] },
      },
      take: 100,
      orderBy: { createdAt: "desc" },
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
    }).catch(() => []);

    return NextResponse.json({
      disputes: disputes.map((d: any) => ({
        id: d.id,
        jobId: d.jobId,
        jobNumber: d.job?.jobNumber || d.jobId,
        customerName: d.job?.customerName || "Unknown",
        technicianName: d.job?.technician?.user?.name || "Unknown",
        type: d.type || "OTHER",
        status: d.status,
        amount: Number(d.job?.finalPrice || d.job?.estimatedCost || 0),
        description: d.description || "N/A",
        evidence: d.evidenceUrls || [],
        createdAt: d.createdAt,
        resolution: d.resolutionNotes,
      })),
      stats: {
        activeWarranties: 0,
        expiringSoon: 0,
        openDisputes: disputes.length,
        totalHoldAmount: 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching disputes:", error);
    return NextResponse.json(
      { error: "Failed to fetch disputes", details: error.message },
      { status: 500 }
    );
  }
}

