import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/customer/jobs
 * Get customer's jobs with rating status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get customer user
    const customer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, phone: true },
    });

    if (!customer) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find jobs where customer email or phone matches
    const jobs = await prisma.jobPost.findMany({
      where: {
        OR: [
          { customerEmail: customer.email },
          { customerPhone: customer.phone },
        ],
      },
      include: {
        dealer: {
          select: {
            businessName: true,
          },
        },
        technician: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        jobReviews: {
          where: {
            reviewerId: session.user.id,
            reviewType: {
              in: ["CUSTOMER_TO_DEALER", "CUSTOMER_TO_TECHNICIAN"],
            },
          },
          select: {
            id: true,
            reviewType: true,
            rating: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform jobs to include rating status
    const jobsWithRatingStatus = jobs.map((job) => {
      const customerReviews = job.jobReviews || [];
      const hasDealerReview = customerReviews.some(
        (r) => r.reviewType === "CUSTOMER_TO_DEALER"
      );
      const hasTechnicianReview = customerReviews.some(
        (r) => r.reviewType === "CUSTOMER_TO_TECHNICIAN"
      );

      return {
        id: job.id,
        jobNumber: job.jobNumber,
        title: job.title,
        description: job.description,
        status: job.status,
        dealerName: job.dealerName,
        technicianName: job.technician?.user?.name || null,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        canRate: job.status === "COMPLETED" || job.status === "COMPLETION_PENDING_APPROVAL",
        hasRated: hasDealerReview && (job.technician ? hasTechnicianReview : true),
        ratingStatus: {
          dealer: hasDealerReview ? "RATED" : job.status === "COMPLETED" ? "PENDING" : "NOT_AVAILABLE",
          technician: job.technician
            ? hasTechnicianReview
              ? "RATED"
              : job.status === "COMPLETED"
              ? "PENDING"
              : "NOT_AVAILABLE"
            : "NOT_APPLICABLE",
        },
        dealerReview: customerReviews.find((r) => r.reviewType === "CUSTOMER_TO_DEALER") || null,
        technicianReview: customerReviews.find((r) => r.reviewType === "CUSTOMER_TO_TECHNICIAN") || null,
      };
    });

    return NextResponse.json({ jobs: jobsWithRatingStatus });
  } catch (error: any) {
    console.error("Error fetching customer jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs", details: error.message },
      { status: 500 }
    );
  }
}

