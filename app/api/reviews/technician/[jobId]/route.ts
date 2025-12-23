import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/reviews/technician/[jobId]
 * Dealer rate technician after job completion
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

    // Verify dealer role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "DEALER") {
      return NextResponse.json({ error: "Only dealers can rate technicians" }, { status: 403 });
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
        technician: {
          include: {
            user: true,
          },
        },
        jobReviews: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify job belongs to this dealer
    if (job.dealerId !== session.user.id) {
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
        review.reviewType === "DEALER_TO_TECHNICIAN" &&
        review.reviewerId === session.user.id
    );

    if (existingReview) {
      return NextResponse.json(
        { error: "Review already submitted for this job" },
        { status: 400 }
      );
    }

    // Verify technician is assigned
    if (!job.assignedTechnicianId || !job.technician) {
      return NextResponse.json(
        { error: "Technician not assigned to this job" },
        { status: 400 }
      );
    }

    const technicianUser = job.technician.user;
    if (!technicianUser) {
      return NextResponse.json({ error: "Technician user not found" }, { status: 404 });
    }

    // Create review
    const review = await prisma.jobReview.create({
      data: {
        jobId: jobId,
        reviewType: "DEALER_TO_TECHNICIAN",
        reviewerId: session.user.id,
        reviewerRole: "DEALER",
        revieweeId: technicianUser.id,
        revieweeType: "TECHNICIAN",
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
    console.error("Error submitting technician review:", error);
    return NextResponse.json(
      { error: "Failed to submit review", details: error.message },
      { status: 500 }
    );
  }
}

