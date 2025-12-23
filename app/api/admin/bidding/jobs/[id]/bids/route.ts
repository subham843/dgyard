import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    const bids = await prisma.jobBid.findMany({
      where: { jobId: id },
      include: {
        technician: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { offeredPrice: "asc" },
    });

    // Get the winning bid (job with assigned technician)
    const job = await prisma.jobPost.findUnique({
      where: { id },
      select: { assignedTechnicianId: true },
    });

    return NextResponse.json({
      bids: bids.map((bid) => ({
        id: bid.id,
        jobId: bid.jobId,
        jobNumber: id,
        technicianId: bid.technicianId,
        technicianName: bid.technician?.user?.name || "Unknown",
        amount: Number(bid.offeredPrice || 0),
        status: bid.status,
        isWinner: bid.technicianId === job?.assignedTechnicianId,
        trustScore: bid.technician?.trustScore || 0,
        riskScore: bid.technician?.trustScore ? 100 - (bid.technician.trustScore || 0) : 50,
        suspiciousFlags: [] as string[],
        createdAt: bid.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching bids:", error);
    return NextResponse.json(
      { error: "Failed to fetch bids", details: error.message },
      { status: 500 }
    );
  }
}

