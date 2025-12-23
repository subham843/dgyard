import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateTechnicianTrustScore, calculateAverageRating } from "@/lib/ratings";

export async function GET() {
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
      select: {
        id: true,
        rating: true,
        totalJobs: true,
        completedJobs: true,
      },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Technician profile not found" },
        { status: 404 }
      );
    }

    // Get complaints count
    const complaints = await prisma.jobPost.count({
      where: {
        assignedTechnicianId: technician.id,
        status: "WARRANTY",
      },
    });

    // Get penalties (from job payments)
    const jobPayments = await prisma.jobPayment.findMany({
      where: { technicianId: technician.id },
    });
    const penaltiesApplied = jobPayments.filter(p => p.penaltyAmount && p.penaltyAmount > 0).length;

    // Calculate metrics
    const jobSuccessRate = technician.totalJobs > 0
      ? (technician.completedJobs / technician.totalJobs) * 100
      : 0;

    // Calculate trust score using new formula
    const trustScore = await calculateTechnicianTrustScore(technician.id);

    // Get average rating from JobReview
    const { averageRating, totalReviews } = await calculateAverageRating(
      session.user.id,
      "TECHNICIAN"
    );

    // AI Improvement Suggestions (simplified)
    const improvements: string[] = [];
    if (jobSuccessRate < 80) {
      improvements.push("Improve job completion rate to increase trust score");
    }
    if (complaints > 0) {
      improvements.push("Address customer complaints promptly to maintain trust");
    }
    if (technician.rating < 4) {
      improvements.push("Focus on delivering quality work to improve ratings");
    }
    if (penaltiesApplied > 0) {
      improvements.push("Avoid penalties by following platform guidelines");
    }

    return NextResponse.json({
      currentScore: Math.min(100, Math.max(0, trustScore)),
      jobSuccessRate: Math.round(jobSuccessRate * 10) / 10,
      complaintCount: complaints,
      penaltiesApplied,
      reviews: {
        averageRating: averageRating,
        totalReviews: totalReviews,
      },
      improvements,
    });
  } catch (error) {
    console.error("Error fetching trust score:", error);
    return NextResponse.json(
      { error: "Failed to fetch trust score" },
      { status: 500 }
    );
  }
}

