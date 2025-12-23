import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/reviews/dealer/[jobId]
 * Technician rate dealer after job completion
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify technician role
    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!technician) {
      return NextResponse.json({ error: "Only technicians can rate dealers" }, { status: 403 });
    }

    const { jobId } = await params;
    const body = await request.json();
    const { rating, comment } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating is required (1-5 stars)" },
        { status: 400 }
      );
    }

    // Fetch job
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        dealer: true,
        jobReviews: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify technician is assigned to this job
    if (job.assignedTechnicianId !== technician.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify job is completed
    if (job.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Job must be completed before rating" },
        { status: 400 }
      );
    }

    // Check if review already exists
    const existingReview = job.jobReviews.find(
      (review) =>
        review.reviewType === "TECHNICIAN_TO_DEALER" &&
        review.reviewerId === session.user.id
    );

    if (existingReview) {
      return NextResponse.json(
        { error: "Review already submitted for this job" },
        { status: 400 }
      );
    }

    // Get dealer user
    const dealerUser = await prisma.user.findUnique({
      where: { id: job.dealerId },
    });

    if (!dealerUser) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    // Create review
    const review = await prisma.jobReview.create({
      data: {
        jobId: jobId,
        reviewType: "TECHNICIAN_TO_DEALER",
        reviewerId: session.user.id,
        reviewerRole: "TECHNICIAN",
        revieweeId: dealerUser.id,
        revieweeType: "DEALER",
        rating: rating,
        comment: comment || null,
        isLocked: true, // Lock immediately after submission
      },
    });

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error: any) {
    console.error("Error submitting dealer review:", error);
    return NextResponse.json(
      { error: "Failed to submit review", details: error.message },
      { status: 500 }
    );
  }
}

