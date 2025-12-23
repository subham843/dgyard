import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDealerTrustScore, calculateAverageRating, getTrustBadge } from "@/lib/ratings";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "DEALER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dealer = await prisma.dealer.findUnique({
      where: { userId: session.user.id },
    });

    if (!dealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    // Get job statistics
    const totalJobs = await prisma.jobPost.count({
      where: { dealerId: session.user.id },
    });

    const activeJobs = await prisma.jobPost.count({
      where: {
        dealerId: session.user.id,
        status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] },
      },
    });

    const completedJobs = await prisma.jobPost.count({
      where: {
        dealerId: session.user.id,
        status: "COMPLETED",
      },
    });

    // Get warranty jobs (jobs with active warranties)
    const warrantyJobs = await prisma.warranty.count({
      where: {
        job: {
          dealerId: session.user.id,
        },
        status: { in: ["ACTIVE", "ISSUE_REPORTED", "REWORK_IN_PROGRESS"] },
      },
    });

    // Get open disputes
    const openDisputes = await prisma.dispute.count({
      where: {
        job: {
          dealerId: session.user.id,
        },
        status: { in: ["OPEN", "UNDER_REVIEW"] },
      },
    });

    // Get free trial info
    // freeTrialServices is the total allocated, we need to track used vs remaining
    const freeTrialTotal = dealer.freeTrialServices || 0;
    const freeTrialUsed = Math.min(totalJobs, freeTrialTotal); // Jobs count up to total
    const freeTrialRemaining = Math.max(0, freeTrialTotal - freeTrialUsed);

    // Get payment statistics
    const payments = await prisma.jobPayment.findMany({
      where: {
        dealerId: session.user.id,
        paymentType: "SERVICE_PAYMENT",
        status: "RELEASED",
      },
    });

    const totalEarnings = await prisma.order.aggregate({
      where: {
        userId: session.user.id,
        paymentStatus: "PAID",
      },
      _sum: {
        total: true,
      },
    });

    const totalServiceSpend = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate trust score and average rating
    const trustScore = await calculateDealerTrustScore(session.user.id);
    const { averageRating, totalReviews } = await calculateAverageRating(
      session.user.id,
      "DEALER"
    );
    const trustBadge = getTrustBadge(trustScore);

    return NextResponse.json({
      totalJobs,
      activeJobs,
      completedJobs,
      warrantyJobs,
      openDisputes,
      freeTrialUsed,
      freeTrialRemaining,
      totalEarnings: totalEarnings._sum.total || 0,
      totalServiceSpend,
      trustScore,
      trustBadge: trustBadge.status,
      trustBadgeColor: trustBadge.color,
      averageRating,
      totalReviews,
    });
  } catch (error: any) {
    console.error("Error fetching dealer stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}



