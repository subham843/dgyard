import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateServiceCommission } from "@/lib/services/commission-calculator";
import { isPaymentLocked, filterDealerInfoForTechnician } from "@/lib/services/job-privacy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: jobId } = await params;

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Technician profile not found" },
        { status: 404 }
      );
    }

    // Get job assigned to this technician
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        dealer: {
          include: {
            dealer: true, // Include Dealer profile
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Allow viewing if:
    // 1. Job is assigned to this technician, OR
    // 2. Job is PENDING and unassigned (available job)
    const isAssignedToTechnician = job.assignedTechnicianId === technician.id;
    const isAvailableJob = job.status === "PENDING" && !job.assignedTechnicianId;
    
    if (!isAssignedToTechnician && !isAvailableJob) {
      return NextResponse.json(
        { error: "Unauthorized to view this job" },
        { status: 403 }
      );
    }

    // Check if payment is locked for this job
    const paymentLocked = await isPaymentLocked(job.id);

    // Filter dealer information based on payment status
    const dealerInfo = filterDealerInfoForTechnician(job.dealer, paymentLocked);

    // Filter location info (hide full address before payment)
    const locationInfo: any = {
      city: job.city || "",
      state: job.state || "",
      latitude: job.latitude || null,
      longitude: job.longitude || null,
      placeName: job.placeName || null,
    };
    
    // Only include address and pincode if payment is locked
    if (paymentLocked) {
      locationInfo.address = job.address || "";
      locationInfo.pincode = job.pincode || "";
    }
    
    const formattedJob = {
      id: job.id,
      jobNumber: job.jobNumber,
      title: job.title || job.jobNumber,
      description: job.description,
      status: job.status,
      location: locationInfo,
      dealer: dealerInfo,
      paymentLocked, // Add payment status to response
      customerName: paymentLocked ? job.customerName : undefined,
      customerPhone: paymentLocked ? job.customerPhone : undefined,
      customerEmail: paymentLocked ? job.customerEmail : undefined,
      scheduledAt: paymentLocked ? job.scheduledAt?.toISOString() : undefined,
      workDetails: paymentLocked ? job.workDetails : undefined,
      warrantyDays: job.warrantyDays || undefined, // Always show warranty days
    };

    // Calculate net amount (commission-deducted) - technician should never see commission
    const totalAmount = job.finalPrice || job.estimatedCost || 0;
    let netAmount = totalAmount;
    
    if (totalAmount > 0) {
      try {
        const commissionResult = await calculateServiceCommission({
          jobId: job.id,
          totalAmount,
          serviceCategoryId: job.serviceCategoryId || undefined,
          serviceSubCategoryId: job.serviceSubCategoryId || undefined,
          city: job.city || undefined,
          region: job.state || undefined,
          dealerId: job.dealerId || undefined,
        });
        
        // Return only net amount (after commission) to technician
        netAmount = commissionResult.netAmount;
      } catch (error) {
        console.error("Error calculating commission for technician view:", error);
        // If commission calculation fails, still return the amount but log the error
        // This ensures technicians can still see jobs even if commission calc fails
      }
    }

    // Set amount to net amount (commission already deducted)
    formattedJob.amount = netAmount;

    // Check if technician has already placed a bid for this job
    const existingBid = await prisma.jobBid.findFirst({
      where: {
        jobId: jobId,
        technicianId: technician.id,
        isCounterOffer: false, // Only check original bids, not dealer counter offers
        status: { in: ["PENDING", "COUNTERED", "ACCEPTED"] },
      },
      include: {
        counterOffers: {
          where: {
            status: { in: ["PENDING", "ACCEPTED"] },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    formattedJob.hasBid = !!existingBid;
    formattedJob.bidStatus = existingBid?.status || null;
    formattedJob.hasCounterOffer = existingBid?.counterOffers && existingBid.counterOffers.length > 0;
    formattedJob.counterOffer = existingBid?.counterOffers?.[0] || null;

    return NextResponse.json({ job: formattedJob });
  } catch (error: any) {
    console.error("Error fetching technician job:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch job",
        message: error.message || "An unexpected error occurred"
      },
      { status: 500 }
    );
  }
}

