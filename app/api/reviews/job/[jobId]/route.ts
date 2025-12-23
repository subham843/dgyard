import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/reviews/job/[jobId]
 * Customer rating page - allows customer to rate dealer or technician after job completion
 * Each link allows only one review type
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    const { dealerRating, dealerComment, technicianRating, technicianComment } = body;

    // Validate that exactly one rating is provided (one review per link)
    const hasDealerRating = dealerRating && dealerRating >= 1 && dealerRating <= 5;
    const hasTechnicianRating = technicianRating && technicianRating >= 1 && technicianRating <= 5;

    if (!hasDealerRating && !hasTechnicianRating) {
      return NextResponse.json(
        { error: "Rating is required (1-5 stars)" },
        { status: 400 }
      );
    }

    // Ensure only one review type is provided
    if (hasDealerRating && hasTechnicianRating) {
      return NextResponse.json(
        { error: "Please submit only one review at a time" },
        { status: 400 }
      );
    }

    // Fetch job
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        dealer: true,
        technician: {
          include: {
            user: true,
          },
        },
        jobReviews: true, // Check if reviews already exist
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify job is completed
    if (job.status !== "COMPLETED" && job.status !== "COMPLETION_PENDING_APPROVAL") {
      return NextResponse.json(
        { error: "Job must be completed before rating" },
        { status: 400 }
      );
    }

    // For customer reviews, find customer by email or phone
    // For dealer reviews, use session
    let customer = null;
    let reviewerId: string;
    let reviewerRole: "USER" | "DEALER" | "TECHNICIAN";

    if (hasDealerRating || hasTechnicianRating) {
      // Customer review - find customer by email/phone
      customer = await prisma.user.findFirst({
        where: {
          OR: [
            { email: job.customerEmail || "" },
            { phone: job.customerPhone },
          ],
        },
      });

      if (!customer) {
        return NextResponse.json(
          { error: "Customer account not found. Please register first." },
          { status: 404 }
        );
      }
      reviewerId = customer.id;
      reviewerRole = "USER";
    } else {
      // This shouldn't happen due to validation above, but handle it
      return NextResponse.json(
        { error: "Invalid review request" },
        { status: 400 }
      );
    }

    // Note: We'll check for existing reviews per review type below, not here
    // This allows customers to submit reviews separately

    // Get dealer user (only if dealer review is being submitted)
    let dealerUser = null;
    if (hasDealerRating) {
      dealerUser = await prisma.user.findUnique({
        where: { id: job.dealerId },
      });

      if (!dealerUser) {
        return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
      }
    }

    // Get technician user (only if technician review is being submitted)
    let technicianUser = null;
    if (hasTechnicianRating) {
      if (!job.assignedTechnicianId) {
        return NextResponse.json(
          { error: "Technician not assigned to this job" },
          { status: 400 }
        );
      }

      technicianUser = job.technician?.user;
      if (!technicianUser) {
        return NextResponse.json({ error: "Technician user not found" }, { status: 404 });
      }
    }

    // Check which reviews already exist
    const existingDealerReview = job.jobReviews.find(
      (review) =>
        review.reviewType === "CUSTOMER_TO_DEALER" &&
        review.reviewerId === reviewerId
    );
    const existingTechnicianReview = job.jobReviews.find(
      (review) =>
        review.reviewType === "CUSTOMER_TO_TECHNICIAN" &&
        review.reviewerId === reviewerId
    );

    // Create reviews in a transaction (only create the ones that don't exist and are provided)
    const reviewsToCreate: any[] = [];

    if (hasDealerRating && !existingDealerReview) {
      reviewsToCreate.push(
        prisma.jobReview.create({
          data: {
            jobId: jobId,
            reviewType: "CUSTOMER_TO_DEALER",
            reviewerId: reviewerId,
            reviewerRole: reviewerRole,
            revieweeId: dealerUser.id,
            revieweeType: "DEALER",
            rating: dealerRating,
            comment: dealerComment || null,
            otpVerified: false, // No OTP required
            isLocked: true,
          },
        })
      );
    }

    if (hasTechnicianRating && !existingTechnicianReview) {
      reviewsToCreate.push(
        prisma.jobReview.create({
          data: {
            jobId: jobId,
            reviewType: "CUSTOMER_TO_TECHNICIAN",
            reviewerId: reviewerId,
            reviewerRole: reviewerRole,
            revieweeId: technicianUser.id,
            revieweeType: "TECHNICIAN",
            rating: technicianRating,
            comment: technicianComment || null,
            otpVerified: false, // No OTP required
            isLocked: true,
          },
        })
      );
    }

    if (reviewsToCreate.length === 0) {
      return NextResponse.json(
        { error: "Reviews already submitted or no valid ratings provided" },
        { status: 400 }
      );
    }

    const createdReviews = await prisma.$transaction(reviewsToCreate);
    const dealerReview = createdReviews.find((r: any) => r.reviewType === "CUSTOMER_TO_DEALER");
    const technicianReview = createdReviews.find((r: any) => r.reviewType === "CUSTOMER_TO_TECHNICIAN");

    // Check if both reviews now exist (after creation)
    const updatedJob = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: { jobReviews: true },
    });

    const hasDealerReview = updatedJob?.jobReviews.some(
      (r) => r.reviewType === "CUSTOMER_TO_DEALER" && r.reviewerId === reviewerId
    );
    const hasTechnicianReview = updatedJob?.jobReviews.some(
      (r) => r.reviewType === "CUSTOMER_TO_TECHNICIAN" && r.reviewerId === reviewerId
    );

    // Update job: Mark as fully completed and start warranty (only if both reviews are submitted)
    if (hasDealerReview && hasTechnicianReview && job.status !== "COMPLETED") {
      const warrantyStartDate = job.completedAt || new Date();
      await prisma.jobPost.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          warrantyStartDate: warrantyStartDate,
        },
      });
    }

    // Update dealer and technician ratings (average calculation)
    // Note: Trust score will be recalculated by background job
    
    return NextResponse.json({
      success: true,
      message: createdReviews.length > 1 
        ? "Reviews submitted successfully. Warranty has started."
        : "Review submitted successfully.",
      reviews: {
        dealer: dealerReview || null,
        technician: technicianReview || null,
      },
    });
  } catch (error: any) {
    console.error("Error submitting reviews:", error);
    return NextResponse.json(
      { error: "Failed to submit reviews", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews/job/[jobId]
 * Get reviews for a specific job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const reviews = await prisma.jobReview.findMany({
      where: {
        jobId: jobId,
        isHidden: false, // Don't show hidden reviews
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews", details: error.message },
      { status: 500 }
    );
  }
}

