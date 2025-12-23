import { prisma } from "@/lib/prisma";

/**
 * Calculate average rating for a user (dealer or technician)
 * from JobReview model
 */
export async function calculateAverageRating(
  userId: string,
  revieweeType: "DEALER" | "TECHNICIAN"
): Promise<{ averageRating: number; totalReviews: number }> {
  const reviews = await prisma.jobReview.findMany({
    where: {
      revieweeId: userId,
      revieweeType: revieweeType,
      isHidden: false, // Only count visible reviews
      isLocked: true, // Only count locked (submitted) reviews
    },
    select: {
      rating: true,
    },
  });

  if (reviews.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  return {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalReviews: reviews.length,
  };
}

/**
 * Calculate trust score for a technician
 * Trust score factors:
 * - Average rating (0-100, scaled from 1-5 stars)
 * - Job completion rate
 * - Complaints count
 * - Penalties count
 */
export async function calculateTechnicianTrustScore(
  technicianId: string
): Promise<number> {
  try {
    console.log(`[Trust Score] Fetching technician data for ID: ${technicianId}`);
    const technician = await prisma.technician.findUnique({
      where: { id: technicianId },
      select: {
        userId: true,
        rating: true, // Legacy rating field
        totalJobs: true,
        completedJobs: true,
        isKycCompleted: true, // KYC completion status
      },
    });

    if (!technician) {
      console.log(`[Trust Score] Technician not found for ID: ${technicianId}`);
      return 30; // Return base score instead of 0
    }

    console.log(`[Trust Score] Technician found: userId=${technician.userId}, rating=${technician.rating}, totalJobs=${technician.totalJobs}, completedJobs=${technician.completedJobs}, isKycCompleted=${technician.isKycCompleted}`);

    // Get average rating from JobReview
    const { averageRating } = await calculateAverageRating(technician.userId, "TECHNICIAN");
    console.log(`[Trust Score] Average rating from JobReview: ${averageRating}`);
    
    // Use JobReview average rating if available, otherwise use legacy rating
    const rating = averageRating > 0 ? averageRating : (technician.rating || 0);
    console.log(`[Trust Score] Using rating: ${rating}`);

    // Get complaints count (jobs with WARRANTY status)
    const complaints = await prisma.jobPost.count({
      where: {
        assignedTechnicianId: technicianId,
        status: "WARRANTY",
      },
    });
    console.log(`[Trust Score] Complaints count: ${complaints}`);

    // Get penalties count (check notes field for penalty mentions or use a separate tracking system)
    // For now, we'll use a simpler approach - checking for any payment issues
    const penaltiesApplied = 0; // Can be extended later if penalty tracking is added

    // Calculate job success rate
    const jobSuccessRate =
      technician.totalJobs > 0
        ? (technician.completedJobs / technician.totalJobs) * 100
        : 0;
    console.log(`[Trust Score] Job success rate: ${jobSuccessRate}%`);

    // Calculate trust score
    // Formula:
    // - Rating contribution: (rating/5) * 40 (max 40 points)
    // - Job success rate: (successRate/100) * 30 (max 30 points)
    // - Base score: 30 points
    // - KYC bonus: +10 points if KYC completed
    // - Complaints penalty: -5 per complaint (max -25 points)
    // - Penalties penalty: -3 per penalty (max -15 points)
    const kycBonus = technician.isKycCompleted ? 10 : 0;
    console.log(`[Trust Score] KYC bonus: ${kycBonus}`);
    
    const ratingPoints = (rating / 5) * 40;
    const jobSuccessPoints = (jobSuccessRate / 100) * 30;
    const complaintsPenalty = Math.min(complaints * 5, 25);
    const penaltiesPenalty = Math.min(penaltiesApplied * 3, 15);
    
    const trustScore = Math.round(
      ratingPoints + // Rating scaled to 40 points
      jobSuccessPoints + // Job success rate scaled to 30 points
      30 + // Base score
      kycBonus - // KYC completion bonus (+10 points)
      complaintsPenalty - // Complaints penalty (capped at 25)
      penaltiesPenalty // Penalties penalty (capped at 15)
    );

    const finalScore = Math.min(100, Math.max(0, trustScore));
    console.log(`[Trust Score] Calculation breakdown: ratingPoints=${ratingPoints.toFixed(2)}, jobSuccessPoints=${jobSuccessPoints.toFixed(2)}, base=30, kycBonus=${kycBonus}, complaintsPenalty=${complaintsPenalty}, penaltiesPenalty=${penaltiesPenalty}, finalScore=${finalScore}`);
    
    return finalScore;
  } catch (error: any) {
    console.error("[Trust Score] Error calculating trust score:", error);
    console.error("[Trust Score] Error stack:", error?.stack);
    // Return base score instead of 0 for errors
    return 30;
  }
}

/**
 * Calculate trust score for a dealer
 * Similar to technician but with dealer-specific metrics
 */
export async function calculateDealerTrustScore(
  dealerId: string
): Promise<number> {
  const dealer = await prisma.dealer.findUnique({
    where: { userId: dealerId },
    select: {
      userId: true,
    },
  });

  if (!dealer) {
    return 0;
  }

  // Get average rating from JobReview
  const { averageRating } = await calculateAverageRating(dealer.userId, "DEALER");
  
  // Get job statistics
  const jobStats = await prisma.jobPost.groupBy({
    by: ["status"],
    where: {
      dealerId: dealerId,
    },
    _count: {
      id: true,
    },
  });

  const totalJobs = jobStats.reduce((sum, stat) => sum + stat._count.id, 0);
  const completedJobs = jobStats.find((stat) => stat.status === "COMPLETED")?._count.id || 0;
  const warrantyJobs = jobStats.find((stat) => stat.status === "WARRANTY")?._count.id || 0;

  // Calculate job success rate
  const jobSuccessRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

  // Calculate trust score (similar formula to technician)
  const trustScore = Math.round(
    (averageRating / 5) * 40 + // Rating scaled to 40 points
      (jobSuccessRate / 100) * 30 + // Job success rate scaled to 30 points
      30 - // Base score
      Math.min(warrantyJobs * 5, 25) // Warranty/complaints penalty (capped at 25)
  );

  return Math.min(100, Math.max(0, trustScore));
}

/**
 * Get detailed breakdown of trust score calculation for a technician
 */
export async function getTechnicianTrustScoreBreakdown(
  technicianId: string
): Promise<{
  trustScore: number;
  breakdown: {
    ratingPoints: number;
    rating: number;
    jobSuccessRatePoints: number;
    jobSuccessRate: number;
    baseScore: number;
    kycBonus: number;
    kycCompleted: boolean;
    complaintsPenalty: number;
    complaintsCount: number;
    penaltiesPenalty: number;
    penaltiesCount: number;
  };
}> {
  const technician = await prisma.technician.findUnique({
    where: { id: technicianId },
    select: {
      userId: true,
      rating: true,
      totalJobs: true,
      completedJobs: true,
      isKycCompleted: true,
    },
  });

  if (!technician) {
    return {
      trustScore: 0,
      breakdown: {
        ratingPoints: 0,
        rating: 0,
        jobSuccessRatePoints: 0,
        jobSuccessRate: 0,
        baseScore: 30,
        kycBonus: 0,
        kycCompleted: false,
        complaintsPenalty: 0,
        complaintsCount: 0,
        penaltiesPenalty: 0,
        penaltiesCount: 0,
      },
    };
  }

  // Get average rating from JobReview
  const { averageRating } = await calculateAverageRating(technician.userId, "TECHNICIAN");
  const rating = averageRating > 0 ? averageRating : (technician.rating || 0);
  const ratingPoints = (rating / 5) * 40;

  // Get complaints count
  const complaintsCount = await prisma.jobPost.count({
    where: {
      assignedTechnicianId: technicianId,
      status: "WARRANTY",
    },
  });
  const complaintsPenalty = Math.min(complaintsCount * 5, 25);

  // Get penalties count
  const penaltiesCount = 0; // Can be extended later
  const penaltiesPenalty = Math.min(penaltiesCount * 3, 15);

  // Calculate job success rate
  const jobSuccessRate =
    technician.totalJobs > 0
      ? (technician.completedJobs / technician.totalJobs) * 100
      : 0;
  const jobSuccessRatePoints = (jobSuccessRate / 100) * 30;

  // KYC bonus
  const kycBonus = technician.isKycCompleted ? 10 : 0;

  // Calculate final trust score
  const trustScore = Math.round(
    ratingPoints +
      jobSuccessRatePoints +
      30 + // Base score
      kycBonus -
      complaintsPenalty -
      penaltiesPenalty
  );

  return {
    trustScore: Math.min(100, Math.max(0, trustScore)),
    breakdown: {
      ratingPoints: Math.round(ratingPoints * 10) / 10,
      rating: rating,
      jobSuccessRatePoints: Math.round(jobSuccessRatePoints * 10) / 10,
      jobSuccessRate: Math.round(jobSuccessRate * 10) / 10,
      baseScore: 30,
      kycBonus: kycBonus,
      kycCompleted: technician.isKycCompleted,
      complaintsPenalty: complaintsPenalty,
      complaintsCount: complaintsCount,
      penaltiesPenalty: penaltiesPenalty,
      penaltiesCount: penaltiesCount,
    },
  };
}

/**
 * Get trust badge status based on trust score
 */
export function getTrustBadge(trustScore: number): {
  status: "TRUSTED" | "NORMAL" | "RISKY";
  color: "green" | "yellow" | "red";
} {
  if (trustScore >= 70) {
    return { status: "TRUSTED", color: "green" };
  } else if (trustScore >= 50) {
    return { status: "NORMAL", color: "yellow" };
  } else {
    return { status: "RISKY", color: "red" };
  }
}

