import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }

    const jobs = await prisma.jobPost.findMany({
      where,
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        dealer: { select: { name: true } },
        technician: { select: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json({
      jobs: jobs.map((job) => ({
        id: job.id,
        jobNumber: job.jobNumber,
        dealerName: job.dealer?.name || job.dealerName || "Unknown",
        technicianName: job.technician?.user?.name,
        customerName: job.customerName || "Unknown",
        status: job.status,
        priority: job.priority || "NORMAL",
        amount: Number(job.finalPrice || job.estimatedCost || 0),
        createdAt: job.createdAt,
        scheduledDate: job.scheduledAt,
        serviceType: job.title || "General",
        address: job.address || "N/A",
        biddingEndsAt: null, // JobPost doesn't have biddingEndsAt - bids are handled via JobBid
      })),
    });
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs", details: error.message },
      { status: 500 }
    );
  }
}

