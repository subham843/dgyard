import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const includeBids = searchParams.get("includeBids") !== "false"; // Default true

    // Get jobs assigned to this technician
    const assignedJobsWhere: any = {
      assignedTechnicianId: technician.id,
    };

    if (status) {
      assignedJobsWhere.status = status;
    }

    const assignedJobs = await prisma.jobPost.findMany({
      where: assignedJobsWhere,
      include: {
        dealer: {
          include: {
            dealer: {
              select: {
                businessName: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Also get jobs where technician has placed bids (if includeBids is true)
    let jobsWithBids: any[] = [];
    if (includeBids) {
      const bids = await prisma.jobBid.findMany({
        where: {
          technicianId: technician.id,
          status: { in: ["PENDING", "COUNTERED", "ACCEPTED"] }, // Only active bids
        },
        include: {
          job: {
            include: {
              dealer: {
                include: {
                  dealer: {
                    select: {
                      businessName: true,
                      fullName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Get bid information for all jobs (including assigned ones)
      const bidMap = new Map();
      bids.forEach(bid => {
        if (bid.job) {
          bidMap.set(bid.job.id, {
            bidStatus: bid.status,
            bidId: bid.id,
            bidPrice: bid.offeredPrice,
          });
        }
      });

      // Add bid info to assigned jobs if they have bids
      assignedJobs.forEach(job => {
        const bidInfo = bidMap.get(job.id);
        if (bidInfo) {
          job.bidStatus = bidInfo.bidStatus;
          job.bidId = bidInfo.bidId;
          job.bidPrice = bidInfo.bidPrice;
        }
      });

      // Get jobs with bids that are NOT assigned
      const assignedJobIds = new Set(assignedJobs.map(j => j.id));
      jobsWithBids = bids
        .map(bid => bid.job)
        .filter(job => job && !assignedJobIds.has(job.id))
        .map(job => ({
          ...job,
          bidStatus: bidMap.get(job.id)?.bidStatus || "PENDING",
          bidId: bidMap.get(job.id)?.bidId,
          bidPrice: bidMap.get(job.id)?.bidPrice,
        }));
    }

    // Combine assigned jobs and jobs with bids (deduplicate by ID)
    const jobMap = new Map();
    
    // First add assigned jobs
    assignedJobs.forEach(job => {
      jobMap.set(job.id, job);
    });
    
    // Then add jobs with bids (won't overwrite assigned jobs)
    jobsWithBids.forEach(job => {
      if (!jobMap.has(job.id)) {
        jobMap.set(job.id, job);
      }
    });
    
    const allJobs = Array.from(jobMap.values());

    const formattedJobs = allJobs.map((job: any) => ({
      id: job.id,
      jobNumber: job.jobNumber,
      title: job.title || job.jobNumber,
      description: job.description,
      status: job.status,
      location: {
        city: job.city || "",
        state: job.state || "",
        address: job.address || "",
      },
      dealer: {
        businessName: job.dealer?.dealer?.businessName || job.dealerName || "N/A",
        fullName: job.dealer?.dealer?.fullName || job.dealerName || "N/A",
      },
      scheduledAt: job.scheduledAt?.toISOString(),
      amount: job.finalPrice || job.estimatedCost,
      warrantyDays: job.warrantyDays,
      // Add bid information if this job has a bid
      hasBid: !!job.bidId,
      bidStatus: job.bidStatus,
      bidId: job.bidId,
      bidPrice: job.bidPrice,
      isAssigned: !!job.assignedTechnicianId && job.assignedTechnicianId === technician.id,
    }));

    return NextResponse.json({ jobs: formattedJobs });
  } catch (error: any) {
    console.error("Error fetching technician jobs:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch jobs",
        message: error.message || "An unexpected error occurred"
      },
      { status: 500 }
    );
  }
}

