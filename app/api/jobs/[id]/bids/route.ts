import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";
import { isPaymentLocked, filterTechnicianInfoForDealer } from "@/lib/services/job-privacy";

// Helper function to calculate distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// POST - Create a bid (for technicians)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TECHNICIAN") {
      return NextResponse.json({ error: "Only technicians can create bids" }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();
    const { offeredPrice, message, isCounterOffer } = data;

    if (!offeredPrice || offeredPrice <= 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }

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

    if (job.status !== "PENDING") {
      return NextResponse.json({ error: "Job is no longer available" }, { status: 400 });
    }

    // Check if technician already has a bid for this job
    const existingBid = await prisma.jobBid.findFirst({
      where: {
        jobId: id,
        technicianId: technician.id,
        status: { in: ["PENDING", "COUNTERED"] },
      },
    });

    if (existingBid && !isCounterOffer) {
      return NextResponse.json(
        { error: "You already have a pending bid for this job" },
        { status: 400 }
      );
    }

    // Check negotiation rounds
    if (isCounterOffer && job.negotiationRounds >= 2) {
      return NextResponse.json(
        { error: "Maximum negotiation rounds (2) reached" },
        { status: 400 }
      );
    }

    // Calculate distance
    let distanceKm: number | null = null;
    if (job.latitude && job.longitude && technician.latitude && technician.longitude) {
      distanceKm = calculateDistance(
        job.latitude,
        job.longitude,
        technician.latitude,
        technician.longitude
      );
    }

    // Determine round number
    let roundNumber = 1;
    if (isCounterOffer) {
      const previousBids = await prisma.jobBid.findMany({
        where: {
          jobId: id,
          technicianId: technician.id,
        },
        orderBy: { createdAt: "desc" },
      });
      roundNumber = previousBids.length > 0 ? previousBids[0].roundNumber + 1 : 2;
    }

    // Set bid expiry (5 minutes for negotiation)
    const bidExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create bid
    const bid = await prisma.jobBid.create({
      data: {
        jobId: id,
        technicianId: technician.id,
        offeredPrice: parseFloat(offeredPrice),
        message: message || null,
        status: "PENDING",
        isCounterOffer: isCounterOffer || false,
        roundNumber,
        distanceKm,
        technicianRating: technician.rating,
        expiresAt: bidExpiresAt,
      },
    });

    // Update job status to NEGOTIATION_PENDING if it's a new bid (not counter)
    if (!isCounterOffer && job.status === "PENDING") {
      await prisma.jobPost.update({
        where: { id },
        data: {
          status: "NEGOTIATION_PENDING",
        },
      });
    }

    // Update job negotiation rounds if counter offer
    if (isCounterOffer) {
      await prisma.jobPost.update({
        where: { id },
        data: {
          negotiationRounds: { increment: 1 },
        },
      });
    }

    // Notify dealer
    try {
      const notificationResult = await sendNotification({
        userId: job.dealerId,
        jobId: id,
        type: isCounterOffer ? "JOB_COUNTER_OFFER" : "JOB_BID_RECEIVED",
        title: isCounterOffer ? "Counter Offer Received" : "New Bid Received",
        message: isCounterOffer
          ? `Technician ${technician.fullName} sent a counter offer of ₹${offeredPrice.toLocaleString("en-IN")} for job ${job.jobNumber}.`
          : `You have received a new bid of ₹${offeredPrice.toLocaleString("en-IN")} from technician ${technician.fullName} for job ${job.jobNumber}.`,
        channels: ["IN_APP", "EMAIL"],
        metadata: { 
          jobNumber: job.jobNumber,
          jobId: id,
          bidId: bid.id,
          technicianName: technician.fullName,
          offeredPrice: parseFloat(offeredPrice)
        },
      });
      
      if (!notificationResult.success) {
        console.error("Failed to send notification:", notificationResult.error);
      } else {
        console.log("Notification sent successfully to dealer:", job.dealerId);
      }
    } catch (notifError: any) {
      console.error("Error sending notification to dealer:", notifError);
      // Don't fail the bid creation if notification fails
    }

    return NextResponse.json({ success: true, bid });
  } catch (error: any) {
    console.error("Error creating bid:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create bid" },
      { status: 500 }
    );
  }
}

// GET - Fetch all bids for a job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const job = await prisma.jobPost.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Only dealer or technician can view bids
    if (session.user.role !== "DEALER" && session.user.role !== "TECHNICIAN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.user.role === "DEALER" && job.dealerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const bids = await prisma.jobBid.findMany({
      where: {
        jobId: id,
      },
      include: {
        technician: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            email: true,
            rating: true,
            primarySkills: true,
            latitude: true,
            longitude: true,
            placeName: true,
            serviceRadiusKm: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Check if payment is locked for this job
    const paymentLocked = await isPaymentLocked(id);

    // Filter technician information based on payment status and role
    const filteredBids = bids.map((bid: any) => {
      let technicianInfo: any = {
        id: bid.technician.id,
        rating: bid.technicianRating || bid.technician.rating,
      };

      if (session.user.role === "DEALER") {
        // For dealers, use privacy filter to hide contact info before payment
        technicianInfo = {
          ...technicianInfo,
          ...filterTechnicianInfoForDealer(bid.technician, paymentLocked),
        };
      } else {
        // For technicians viewing their own bids, show all info
        technicianInfo = {
          id: bid.technician.id,
          fullName: bid.technician.fullName,
          mobile: bid.technician.mobile,
          email: bid.technician.email,
          rating: bid.technicianRating || bid.technician.rating,
        };
      }

      return {
        ...bid,
        technician: technicianInfo,
      };
    });

    return NextResponse.json({ bids: filteredBids });
  } catch (error: any) {
    console.error("Error fetching bids:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bids" },
      { status: 500 }
    );
  }
}
