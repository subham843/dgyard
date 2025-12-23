import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";

// POST - Technician accepts dealer's counter offer
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
      return NextResponse.json({ error: "Only technicians can accept counter offers" }, { status: 403 });
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

    // Verify this bid belongs to the technician
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

    // Accept the counter offer - use dealer's counter offer price as final price
    const finalPrice = dealerCounterOffer.offeredPrice;

    // Update job with final price and assign to technician - set to WAITING_FOR_PAYMENT
    const updatedJob = await prisma.jobPost.update({
      where: { id },
      data: {
        status: "WAITING_FOR_PAYMENT",
        assignedTechnicianId: technician.id,
        assignedAt: new Date(),
        finalPrice: finalPrice,
        priceLocked: true,
        // negotiationRounds already updated when dealer sent counter offer
      },
    });

    // Mark dealer's counter offer as ACCEPTED
    await prisma.jobBid.update({
      where: { id: dealerCounterOffer.id },
      data: {
        status: "ACCEPTED",
      },
    });

    // Mark technician's original bid as ACCEPTED (for history)
    await prisma.jobBid.update({
      where: { id: bidId },
      data: {
        status: "ACCEPTED",
      },
    });

    // Reject all other bids for this job
    await prisma.jobBid.updateMany({
      where: {
        jobId: id,
        id: { notIn: [dealerCounterOffer.id, bidId] },
        status: { in: ["PENDING", "COUNTERED"] },
      },
      data: {
        status: "REJECTED",
      },
    });

    // Notify dealer
    await sendNotification({
      userId: job.dealerId,
      jobId: id,
      type: "JOB_BID_ACCEPTED",
      title: "Counter Offer Accepted!",
      message: `Technician ${technician.fullName} accepted your counter offer of ₹${finalPrice.toLocaleString("en-IN")} for job ${job.jobNumber}.`,
      channels: ["IN_APP", "EMAIL", "WHATSAPP"],
      metadata: { jobNumber: job.jobNumber },
    });

    return NextResponse.json({ 
      success: true, 
      job: updatedJob,
      message: "Counter offer accepted. Job assigned to you." 
    });
  } catch (error: any) {
    console.error("Error accepting counter offer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept counter offer" },
      { status: 500 }
    );
  }
}







