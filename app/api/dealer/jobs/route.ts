import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPaymentLocked, filterTechnicianInfoForDealer } from "@/lib/services/job-privacy";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "DEALER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {
      dealerId: session.user.id,
    };

    if (status && status !== "all") {
      if (status === "REJECTED") {
        // Rejected jobs are CANCELLED with rejectedAt
        where.status = "CANCELLED";
        where.rejectedAt = { not: null };
      } else if (status === "CANCELLED") {
        // Regular cancelled jobs (not rejected)
        where.status = "CANCELLED";
        where.rejectedAt = null;
      } else {
        where.status = status;
      }
    }

    const jobs = await prisma.jobPost.findMany({
      where,
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
        bids: {
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
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Filter technician information based on payment status
    const filteredJobs = await Promise.all(
      jobs.map(async (job) => {
        const paymentLocked = await isPaymentLocked(job.id);
        
        // Filter assigned technician info
        // Show name and service location before payment, all details after payment
        let filteredTechnician = null;
        if (job.technician) {
          filteredTechnician = filterTechnicianInfoForDealer(job.technician, paymentLocked);
        }

        // Filter bid technicians info
        const filteredBids = job.bids.map((bid) => {
          let filteredBidTechnician = null;
          if (bid.technician) {
            filteredBidTechnician = filterTechnicianInfoForDealer(bid.technician, paymentLocked);
          }
          return {
            ...bid,
            technician: filteredBidTechnician,
          };
        });

        return {
          ...job,
          technician: filteredTechnician,
          bids: filteredBids,
          paymentLocked, // Include payment status for frontend
        };
      })
    );

    return NextResponse.json({ jobs: filteredJobs });
  } catch (error: any) {
    console.error("Error fetching dealer jobs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}




