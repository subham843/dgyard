import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateTechnicianTrustScore, calculateAverageRating, getTrustBadge } from "@/lib/ratings";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get technician profile
    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        isOnline: true,
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

    // Get active jobs (IN_PROGRESS, ASSIGNED)
    let activeJobs = 0;
    try {
      activeJobs = await prisma.jobPost.count({
        where: {
          assignedTechnicianId: technician.id,
          status: {
            in: ["ASSIGNED", "IN_PROGRESS"],
          },
        },
      });
    } catch (error) {
      console.error("Error fetching active jobs:", error);
      activeJobs = 0;
    }

    // Get upcoming jobs (scheduled in future)
    let upcomingJobs = 0;
    try {
      upcomingJobs = await prisma.jobPost.count({
        where: {
          assignedTechnicianId: technician.id,
          scheduledAt: {
            gte: new Date(),
          },
          status: {
            in: ["ASSIGNED", "IN_PROGRESS"],
          },
        },
      });
    } catch (error) {
      console.error("Error fetching upcoming jobs:", error);
      upcomingJobs = 0;
    }

    // Get open bidding jobs (available for bidding)
    let openBiddingJobs = 0;
    try {
      openBiddingJobs = await prisma.jobPost.count({
        where: {
          status: "OPEN_FOR_BIDDING",
          biddingEndDate: {
            gte: new Date(),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching open bidding jobs:", error);
      openBiddingJobs = 0;
    }

    // Get earnings data
    let totalEarnings = 0;
    let warrantyHoldBalance = 0;
    
    try {
      const earningsData = await prisma.jobPayment.aggregate({
        where: {
          technicianId: technician.id,
        },
        _sum: {
          amount: true,
        },
      });
      totalEarnings = earningsData._sum.amount || 0;
    } catch (error) {
      console.error("Error fetching earnings:", error);
      totalEarnings = 0;
    }
    
    // Get warranty hold balance from WarrantyHold model
    try {
      const warrantyHolds = await prisma.warrantyHold.aggregate({
        where: {
          technicianId: technician.id,
          status: { in: ["LOCKED", "FROZEN"] }, // Only active holds
        },
        _sum: {
          holdAmount: true,
        },
      });
      warrantyHoldBalance = warrantyHolds._sum.holdAmount || 0;
    } catch (error) {
      console.error("Error fetching warranty holds:", error);
      warrantyHoldBalance = 0;
    }

    // Get available balance (total - hold - withdrawn)
    let withdrawnAmount = 0;
    
    try {
      const withdrawals = await prisma.withdrawal.aggregate({
        where: {
          technicianId: technician.id,
          status: "PAID",
        },
        _sum: {
          amount: true,
        },
      });
      withdrawnAmount = withdrawals._sum.amount || 0;
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      withdrawnAmount = 0;
    }
    
    const availableBalance = totalEarnings - warrantyHoldBalance - withdrawnAmount;

    // Calculate trust score using new formula with reviews (with error handling)
    let trustScore = 0;
    let averageRating = 0;
    let totalReviews = 0;
    let trustBadge: { status: "TRUSTED" | "NORMAL" | "RISKY"; color: "green" | "yellow" | "red" } = { status: "NORMAL", color: "yellow" };
    
    try {
      console.log(`[Stats API] Calculating trust score for technician ID: ${technician.id}`);
      trustScore = await calculateTechnicianTrustScore(technician.id);
      console.log(`[Stats API] Trust score calculated: ${trustScore}`);
    } catch (error: any) {
      console.error("Error calculating trust score:", error);
      console.error("Error stack:", error?.stack);
      console.error("Error message:", error?.message);
      // Don't set to 0, calculate a base score instead
      // Base score is 30, so even new technicians should have at least 30
      trustScore = 30;
    }
    
    try {
      const ratingData = await calculateAverageRating(
        session.user.id,
        "TECHNICIAN"
      );
      averageRating = ratingData.averageRating || 0;
      totalReviews = ratingData.totalReviews || 0;
    } catch (error) {
      console.error("Error calculating average rating:", error);
      averageRating = 0;
      totalReviews = 0;
    }
    
    try {
      trustBadge = getTrustBadge(trustScore);
    } catch (error) {
      console.error("Error getting trust badge:", error);
      trustBadge = { status: "NORMAL", color: "yellow" };
    }

    // Get unread notifications count (notifications without readAt timestamp)
    let alerts = 0;
    try {
      alerts = await prisma.notification.count({
        where: {
          userId: session.user.id,
          readAt: null,
          channel: "IN_APP", // Only count in-app notifications
        },
      });
    } catch (error) {
      console.error("Error fetching notifications count:", error);
      alerts = 0;
    }

    const responseData = {
      activeJobs,
      upcomingJobs,
      openBiddingJobs,
      totalEarnings,
      availableBalance: Math.max(0, availableBalance),
      warrantyHoldBalance,
      trustScore: trustScore || 30, // Default to base score (30) instead of 0
      trustBadge: trustBadge?.status || "NORMAL",
      trustBadgeColor: trustBadge?.color || "yellow",
      averageRating: averageRating || 0,
      totalReviews: totalReviews || 0,
      isOnline: technician.isOnline,
      alerts: alerts || 0,
    };
    
    console.log("[Stats API] Returning response data:", JSON.stringify(responseData, null, 2));
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { 
        error: "Failed to fetch dashboard stats",
        message: error.message || "Unknown error",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

