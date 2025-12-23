import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";

// POST - Technician rejects dealer's counter offer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TECHNICIAN") {
      return NextResponse.json({ error: "Only technicians can reject counter offers" }, { status: 403 });
    }

    const { id, bidId } = await params;
    
    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
    });

    if (!technician) {
      return NextResponse.json({ error: "Technician profile not found" }, { status: 404 });
    }

    const job = await prisma.jobPost.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Find the original bid by technician
    const originalBid = await prisma.jobBid.findUnique({
      where: { id: bidId },
    });

    if (!originalBid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    // Check if this bid belongs to the technician
    if (originalBid.technicianId !== technician.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Find dealer's counter offer (bid with previousBidId pointing to this bid)
    const dealerCounterOffer = await prisma.jobBid.findFirst({
      where: {
        previousBidId: bidId,
        jobId: id,
        isCounterOffer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!dealerCounterOffer) {
      return NextResponse.json({ error: "No counter offer found from dealer" }, { status: 400 });
    }

    // Reject the counter offer - mark dealer's counter offer as rejected
    await prisma.jobBid.update({
      where: { id: dealerCounterOffer.id },
      data: {
        status: "REJECTED",
      },
    });

    // Update technician's original bid status back to PENDING (they can send another counter offer)
    await prisma.jobBid.update({
      where: { id: bidId },
      data: {
        status: "PENDING",
      },
    });

    // Notify dealer
    await sendNotification({
      userId: job.dealerId,
      jobId: id,
      type: "JOB_BID_REJECTED",
      title: "Counter Offer Rejected",
      message: `Technician ${technician.fullName} rejected your counter offer for job ${job.jobNumber}.`,
      channels: ["IN_APP", "EMAIL"],
      metadata: { jobNumber: job.jobNumber },
    });

    return NextResponse.json({ 
      success: true,
      message: "Counter offer rejected" 
    });
  } catch (error: any) {
    console.error("Error rejecting counter offer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject counter offer" },
      { status: 500 }
    );
  }
}






