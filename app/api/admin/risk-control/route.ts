import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateTechnicianTrustScore, calculateDealerTrustScore } from "@/lib/ratings";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const risks: any[] = [];

    // Get technicians with risk factors
    const technicians = await prisma.technician.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        jobBids: {
          include: {
            jobPost: {
              select: {
                status: true,
              },
          },
        },
      },
        jobReviews: {
          where: {
            reviewType: {
              in: ["CUSTOMER_TO_TECHNICIAN", "DEALER_TO_TECHNICIAN"],
            },
          },
          select: {
            rating: true,
          },
        },
      },
    });

    technicians.forEach((technician) => {
      const totalJobs = technician.jobBids.filter(
        (bid) => bid.status === "ACCEPTED"
      ).length;
      
      const completedJobs = technician.jobBids.filter(
        (bid) => bid.status === "ACCEPTED" && bid.jobPost.status === "COMPLETED"
      ).length;

      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
      const averageRating = technician.jobReviews.length > 0
        ? technician.jobReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / technician.jobReviews.length
        : technician.rating || 0;

      const trustScore = calculateTechnicianTrustScore(technician);
      const riskScore = 100 - trustScore;

      const issues: string[] = [];
      if (completionRate < 70) issues.push("Low completion rate");
      if (averageRating < 3.5) issues.push("Low rating");
      if (technician.accountStatus === "SUSPENDED") issues.push("Account suspended");
      if (totalJobs === 0 && technician.accountStatus === "APPROVED") issues.push("No jobs completed");

      if (riskScore >= 40 || issues.length > 0) {
        let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
        if (riskScore >= 80) riskLevel = "CRITICAL";
        else if (riskScore >= 60) riskLevel = "HIGH";
        else if (riskScore >= 40) riskLevel = "MEDIUM";

        risks.push({
          id: technician.id,
          type: "TECHNICIAN",
          name: technician.user?.name || "Unknown Technician",
          email: technician.user?.email,
          riskScore: Math.round(riskScore),
          riskLevel,
          issues,
          lastUpdated: new Date(),
        });
      }
    });

    // Get dealers with risk factors
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

    dealers.forEach((dealer) => {
      const totalJobs = dealer.jobPosts.length;
      const completedJobs = dealer.jobPosts.filter(
        (job) => job.status === "COMPLETED"
      ).length;

      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
      const averageRating = dealer.jobReviews.length > 0
        ? dealer.jobReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / dealer.jobReviews.length
        : dealer.rating || 0;

      const trustScore = calculateDealerTrustScore(dealer);
      const riskScore = 100 - trustScore;

      const issues: string[] = [];
      if (completionRate < 70) issues.push("Low completion rate");
      if (averageRating < 3.5) issues.push("Low rating");
      if (dealer.accountStatus === "SUSPENDED") issues.push("Account suspended");
      if (totalJobs === 0 && dealer.accountStatus === "APPROVED") issues.push("No jobs posted");

      if (riskScore >= 40 || issues.length > 0) {
        let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
        if (riskScore >= 80) riskLevel = "CRITICAL";
        else if (riskScore >= 60) riskLevel = "HIGH";
        else if (riskScore >= 40) riskLevel = "MEDIUM";

        risks.push({
          id: dealer.id,
          type: "DEALER",
          name: dealer.user?.name || "Unknown Dealer",
          email: dealer.user?.email,
          riskScore: Math.round(riskScore),
          riskLevel,
          issues,
          lastUpdated: new Date(),
        });
      }
    });

    // Get high-risk jobs
    const highRiskJobs = await prisma.jobPost.findMany({
      where: {
        OR: [
          { status: "CANCELLED" },
          { disputes: { some: {} } },
        ],
      },
      include: {
        dealer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        disputes: {
          select: {
            id: true,
          },
        },
      },
      take: 20,
    });

    highRiskJobs.forEach((job) => {
      const issues: string[] = [];
      if (job.status === "CANCELLED") issues.push("Job cancelled");
      if (job.disputes && job.disputes.length > 0) issues.push(`${job.disputes.length} dispute(s)`);

      risks.push({
        id: job.id,
        type: "JOB",
        name: job.title || `Job #${job.jobNumber}`,
        email: undefined,
        riskScore: issues.length * 30,
        riskLevel: issues.length >= 2 ? "HIGH" : "MEDIUM",
        issues,
        lastUpdated: job.updatedAt,
      });
    });

    return NextResponse.json({ risks });
  } catch (error) {
    console.error("Error fetching risk data:", error);
    return NextResponse.json(
      { error: "Failed to fetch risk data" },
      { status: 500 }
    );
  }
}

