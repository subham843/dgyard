import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateTechnicianTrustScore, calculateAverageRating } from "@/lib/ratings";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
                completedAt: true,
                scheduledDate: true,
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

    const performanceData = technicians.map((technician) => {
      const totalJobs = technician.jobBids.filter(
        (bid) => bid.status === "ACCEPTED"
      ).length;
      
      const completedJobs = technician.jobBids.filter(
        (bid) => bid.status === "ACCEPTED" && bid.jobPost.status === "COMPLETED"
      ).length;
      
      const cancelledJobs = technician.jobBids.filter(
        (bid) => bid.status === "ACCEPTED" && bid.jobPost.status === "CANCELLED"
      ).length;

      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

      const onTimeJobs = technician.jobBids.filter((bid) => {
        if (bid.status === "ACCEPTED" && bid.jobPost.status === "COMPLETED") {
          const scheduledDate = bid.jobPost.scheduledDate;
          const completedAt = bid.jobPost.completedAt;
          if (scheduledDate && completedAt) {
            return new Date(completedAt) <= new Date(scheduledDate);
          }
        }
        return false;
      }).length;

      const onTimeCompletion = completedJobs > 0 ? (onTimeJobs / completedJobs) * 100 : 0;

      const averageRating = calculateAverageRating(technician.jobReviews);
      const trustScore = calculateTechnicianTrustScore(technician);

      const totalEarnings = technician.jobBids
        .filter((bid) => bid.status === "ACCEPTED" && bid.jobPost.status === "COMPLETED")
        .reduce((sum, bid) => sum + (bid.finalAmount || bid.amount || 0), 0);

      return {
        id: technician.id,
        name: technician.user?.name || "Unknown",
        email: technician.user?.email || "",
        rating: technician.rating || 0,
        totalJobs,
        completedJobs,
        cancelledJobs,
        completionRate: Math.round(completionRate * 10) / 10,
        averageRating: averageRating || technician.rating || 0,
        totalEarnings,
        onTimeCompletion: Math.round(onTimeCompletion * 10) / 10,
        responseTime: 0, // Can be calculated based on bid submission time
        trustScore: Math.round(trustScore),
        accountStatus: technician.accountStatus,
      };
    });

    return NextResponse.json({ technicians: performanceData });
  } catch (error) {
    console.error("Error fetching technician performance:", error);
    return NextResponse.json(
      { error: "Failed to fetch technician performance" },
      { status: 500 }
    );
  }
}

