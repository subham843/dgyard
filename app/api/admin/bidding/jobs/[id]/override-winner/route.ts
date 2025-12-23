import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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
    const body = await request.json();
    const { bidId } = body;

    if (!bidId) {
      return NextResponse.json({ error: "Bid ID is required" }, { status: 400 });
    }

    // Get bid to find technician
    const bid = await prisma.jobBid.findUnique({
      where: { id: bidId },
      select: { technicianId: true },
    });

    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    // Override winner
    await prisma.jobPost.update({
      where: { id },
      data: {
        assignedTechnicianId: bid.technicianId,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "Bid winner overridden" });
  } catch (error: any) {
    console.error("Error overriding winner:", error);
    return NextResponse.json(
      { error: "Failed to override winner", details: error.message },
      { status: 500 }
    );
  }
}

