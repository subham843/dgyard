import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculateTrustScore } from "@/lib/trust-score-engine";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { rating, comment, adminNotes } = await request.json();

    // Get existing review
    const existingReview = await prisma.jobReview.findUnique({
      where: { id },
      include: {
        job: true,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Rating not found" },
        { status: 404 }
      );
    }

    // Update rating
    const updatedReview = await prisma.jobReview.update({
      where: { id },
      data: {
        rating: rating !== undefined ? parseInt(rating) : undefined,
        comment: comment !== undefined ? comment : undefined,
        adminNotes: adminNotes !== undefined ? adminNotes : undefined,
      },
    });

    // Recalculate trust score if rating changed
    if (rating !== undefined && rating !== existingReview.rating) {
      try {
        // Determine user type from reviewee
        const userType = existingReview.revieweeType === "TECHNICIAN" ? "TECHNICIAN" : "DEALER";
        await recalculateTrustScore(existingReview.revieweeId, userType);
      } catch (error) {
        console.error("Error recalculating trust score:", error);
        // Don't fail the request if recalculation fails
      }
    }

    return NextResponse.json({ rating: updatedReview });
  } catch (error: any) {
    console.error("Error updating rating:", error);
    return NextResponse.json(
      { error: "Failed to update rating", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get existing review
    const existingReview = await prisma.jobReview.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Rating not found" },
        { status: 404 }
      );
    }

    const revieweeId = existingReview.revieweeId;
    const userType = existingReview.revieweeType === "TECHNICIAN" ? "TECHNICIAN" : "DEALER";

    // Delete rating
    await prisma.jobReview.delete({
      where: { id },
    });

    // Recalculate trust score
    try {
      await recalculateTrustScore(revieweeId, userType);
    } catch (error) {
      console.error("Error recalculating trust score:", error);
      // Don't fail the request if recalculation fails
    }

    return NextResponse.json({ success: true, message: "Rating deleted" });
  } catch (error: any) {
    console.error("Error deleting rating:", error);
    return NextResponse.json(
      { error: "Failed to delete rating", details: error.message },
      { status: 500 }
    );
  }
}




