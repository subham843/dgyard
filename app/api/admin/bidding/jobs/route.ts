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

    const jobs = await prisma.jobPost.findMany({
      where: {
        status: "PENDING",
        assignedTechnicianId: null, // Jobs without assigned technician are open for bidding
      },
      include: {
        dealer: { select: { name: true } },
        _count: {
          select: {
            bids: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      jobs: jobs.map((job) => ({
        id: job.id,
        jobNumber: job.jobNumber,
        dealerName: job.dealer?.name || job.dealerName || "Unknown",
        serviceType: job.title || "General",
        budget: Number(job.estimatedCost || 0),
        biddingEndsAt: null, // JobPost doesn't have biddingEndsAt
        totalBids: job._count.bids || 0,
        status: "OPEN" as const,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching bidding jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch bidding jobs", details: error.message },
      { status: 500 }
    );
  }
}

