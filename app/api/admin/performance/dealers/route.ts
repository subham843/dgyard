import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDealerTrustScore, calculateAverageRating } from "@/lib/ratings";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const dealers = await prisma.dealer.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        jobPosts: {
          select: {
            status: true,
            amount: true,
            completedAt: true,
          },
        },
        jobReviews: {
          where: {
            reviewType: "CUSTOMER_TO_DEALER",
          },
          select: {
            rating: true,
          },
        },
      },
    });

    const performanceData = dealers.map((dealer) => {
      const totalJobs = dealer.jobPosts.length;
      const completedJobs = dealer.jobPosts.filter(
        (job) => job.status === "COMPLETED"
      ).length;
      const cancelledJobs = dealer.jobPosts.filter(
        (job) => job.status === "CANCELLED"
      ).length;
      const activeJobs = dealer.jobPosts.filter(
        (job) => ["PENDING", "ASSIGNED", "IN_PROGRESS"].includes(job.status)
      ).length;

      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

      const averageRating = calculateAverageRating(dealer.jobReviews);
      const trustScore = calculateDealerTrustScore(dealer);

      const totalRevenue = dealer.jobPosts
        .filter((job) => job.status === "COMPLETED")
        .reduce((sum, job) => sum + (job.amount || 0), 0);

      return {
        id: dealer.id,
        name: dealer.user?.name || "Unknown",
        email: dealer.user?.email || "",
        rating: dealer.rating || 0,
        totalJobs,
        completedJobs,
        cancelledJobs,
        activeJobs,
        completionRate: Math.round(completionRate * 10) / 10,
        averageRating: averageRating || dealer.rating || 0,
        totalRevenue,
        trustScore: Math.round(trustScore),
        accountStatus: dealer.accountStatus,
      };
    });

    return NextResponse.json({ dealers: performanceData });
  } catch (error) {
    console.error("Error fetching dealer performance:", error);
    return NextResponse.json(
      { error: "Failed to fetch dealer performance" },
      { status: 500 }
    );
  }
}

