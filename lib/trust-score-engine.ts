import { prisma } from "@/lib/prisma";

export interface TrustScoreFactors {
  // Rating factors
  averageRating: number;
  totalRatings: number;
  recentLowRatings: number; // 1-2 star ratings in last 30 days
  
  // Job completion factors
  totalJobs: number;
  completedJobs: number;
  onTimeCompletions: number;
  lateCompletions: number;
  abandonedJobs: number;
  
  // OTP factors
  customerOtpClosures: number; // Jobs closed with customer OTP
  dealerOtpClosures: number; // Jobs closed with dealer OTP only
  
  // Complaint & dispute factors
  totalComplaints: number;
  recentComplaints: number; // Last 30 days
  totalDisputes: number;
  resolvedDisputes: number;
  
  // Rework factors
  reworkRequests: number;
  
  // Photo proof
  jobsWithPhotoProof: number;
  
  // Admin actions
  adminForcedClosures: number;
  
  // Job rejection rate
  rejectedJobs: number;
  totalJobOffers: number;
}

/**
 * Calculate trust score based on various factors
 * Returns a score between 0-100
 */
export async function calculateTrustScore(
  userId: string,
  userType: "DEALER" | "TECHNICIAN"
): Promise<number> {
  try {
    const factors = await gatherTrustScoreFactors(userId, userType);
    return computeTrustScore(factors);
  } catch (error) {
    console.error("Error calculating trust score:", error);
    return 50.0; // Default score on error
  }
}

/**
 * Gather all factors that influence trust score
 */
async function gatherTrustScoreFactors(
  userId: string,
  userType: "DEALER" | "TECHNICIAN"
): Promise<TrustScoreFactors> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get user profile
  let profile: any = null;
  if (userType === "TECHNICIAN") {
    profile = await prisma.technician.findUnique({
      where: { userId },
    });
  } else if (userType === "DEALER") {
    profile = await prisma.dealer.findUnique({
      where: { userId },
    });
  }

  // Get job statistics
  const jobStats = await getJobStatistics(userId, userType, thirtyDaysAgo);
  
  // Get rating statistics
  const ratingStats = await getRatingStatistics(userId, userType, thirtyDaysAgo);
  
  // Get complaint/dispute statistics
  const complaintStats = await getComplaintStatistics(userId, userType, thirtyDaysAgo);
  
  // Get rework statistics
  const reworkStats = await getReworkStatistics(userId, userType);
  
  // Get OTP closure statistics
  const otpStats = await getOtpStatistics(userId, userType);

  return {
    averageRating: ratingStats.averageRating,
    totalRatings: ratingStats.totalRatings,
    recentLowRatings: ratingStats.recentLowRatings,
    totalJobs: jobStats.totalJobs,
    completedJobs: jobStats.completedJobs,
    onTimeCompletions: jobStats.onTimeCompletions,
    lateCompletions: jobStats.lateCompletions,
    abandonedJobs: jobStats.abandonedJobs,
    customerOtpClosures: otpStats.customerOtpClosures,
    dealerOtpClosures: otpStats.dealerOtpClosures,
    totalComplaints: complaintStats.totalComplaints,
    recentComplaints: complaintStats.recentComplaints,
    totalDisputes: complaintStats.totalDisputes,
    resolvedDisputes: complaintStats.resolvedDisputes,
    reworkRequests: reworkStats.reworkRequests,
    jobsWithPhotoProof: jobStats.jobsWithPhotoProof,
    adminForcedClosures: jobStats.adminForcedClosures,
    rejectedJobs: jobStats.rejectedJobs,
    totalJobOffers: jobStats.totalJobOffers,
  };
}

/**
 * Compute trust score from factors
 * Score range: 0-100
 */
function computeTrustScore(factors: TrustScoreFactors): number {
  let score = 50.0; // Start at neutral

  // Rating impact (max ±20 points)
  if (factors.totalRatings > 0) {
    const ratingImpact = (factors.averageRating - 3.0) * 4; // 3.0 = neutral, scale by 4
    score += Math.max(-20, Math.min(20, ratingImpact));
    
    // Penalty for recent low ratings
    if (factors.recentLowRatings > 0) {
      score -= Math.min(10, factors.recentLowRatings * 2);
    }
  }

  // Job completion impact (max ±15 points)
  if (factors.totalJobs > 0) {
    const completionRate = factors.completedJobs / factors.totalJobs;
    score += (completionRate - 0.8) * 30; // 80% = neutral
    
    // On-time bonus
    if (factors.completedJobs > 0) {
      const onTimeRate = factors.onTimeCompletions / factors.completedJobs;
      score += onTimeRate * 5;
    }
    
    // Late completion penalty
    if (factors.lateCompletions > 0) {
      score -= Math.min(10, factors.lateCompletions * 2);
    }
  }

  // OTP source impact (max ±10 points)
  if (factors.customerOtpClosures + factors.dealerOtpClosures > 0) {
    const customerOtpRate = factors.customerOtpClosures / 
      (factors.customerOtpClosures + factors.dealerOtpClosures);
    // Customer OTP is positive, dealer-only OTP is negative
    score += (customerOtpRate - 0.5) * 20;
    
    // Penalty for too many dealer-only closures
    if (factors.dealerOtpClosures > 3) {
      score -= Math.min(5, (factors.dealerOtpClosures - 3) * 1);
    }
  }

  // Complaint impact (max -20 points)
  if (factors.totalComplaints > 0) {
    score -= Math.min(20, factors.totalComplaints * 4);
  }
  if (factors.recentComplaints > 0) {
    score -= Math.min(10, factors.recentComplaints * 5);
  }

  // Dispute impact (max -15 points)
  if (factors.totalDisputes > 0) {
    const disputeRate = factors.resolvedDisputes / factors.totalDisputes;
    score -= (1 - disputeRate) * 15; // Unresolved disputes hurt more
  }

  // Rework impact (max -10 points)
  if (factors.reworkRequests > 0) {
    score -= Math.min(10, factors.reworkRequests * 3);
  }

  // Photo proof bonus (max +5 points)
  if (factors.totalJobs > 0) {
    const photoProofRate = factors.jobsWithPhotoProof / factors.totalJobs;
    score += photoProofRate * 5;
  }

  // Admin forced closure penalty (max -10 points)
  if (factors.adminForcedClosures > 0) {
    score -= Math.min(10, factors.adminForcedClosures * 5);
  }

  // Job rejection rate impact (max -10 points)
  if (factors.totalJobOffers > 0) {
    const rejectionRate = factors.rejectedJobs / factors.totalJobOffers;
    if (rejectionRate > 0.3) { // More than 30% rejection rate
      score -= (rejectionRate - 0.3) * 20;
    }
  }

  // Abandoned jobs penalty (max -15 points)
  if (factors.abandonedJobs > 0) {
    score -= Math.min(15, factors.abandonedJobs * 5);
  }

  // Clamp score between 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get job statistics for trust score calculation
 */
async function getJobStatistics(
  userId: string,
  userType: "DEALER" | "TECHNICIAN",
  thirtyDaysAgo: Date
) {
  let jobs: any[] = [];
  
  if (userType === "TECHNICIAN") {
    const technician = await prisma.technician.findUnique({
      where: { userId },
      include: {
        assignedJobs: {
          include: {
            jobReviews: true,
          },
        },
      },
    });
    jobs = technician?.assignedJobs || [];
  } else if (userType === "DEALER") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobPosts: {
          include: {
            jobReviews: true,
          },
        },
      },
    });
    jobs = user?.jobPosts || [];
  }

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === "COMPLETED").length;
  
  // Calculate on-time vs late completions
  let onTimeCompletions = 0;
  let lateCompletions = 0;
  let jobsWithPhotoProof = 0;
  let adminForcedClosures = 0;
  let abandonedJobs = 0;

  for (const job of jobs) {
    if (job.status === "COMPLETED" && job.completedAt) {
      // Check if completed on time (within estimated duration)
      if (job.estimatedDuration && job.startedAt) {
        const estimatedEnd = new Date(job.startedAt);
        estimatedEnd.setHours(estimatedEnd.getHours() + job.estimatedDuration);
        if (new Date(job.completedAt) <= estimatedEnd) {
          onTimeCompletions++;
        } else {
          lateCompletions++;
        }
      }
      
      // Check for photo proof
      if (job.afterPhotos && job.afterPhotos.length > 0) {
        jobsWithPhotoProof++;
      }
    }
    
    if (job.status === "CANCELLED" && job.cancelledAt) {
      // Check if cancelled by admin (would need additional field)
      abandonedJobs++;
    }
  }

  // Get job offers/bids for rejection rate
  let rejectedJobs = 0;
  let totalJobOffers = 0;
  
  if (userType === "TECHNICIAN") {
    const bids = await prisma.jobBid.findMany({
      where: {
        technician: {
          userId,
        },
      },
    });
    totalJobOffers = bids.length;
    rejectedJobs = bids.filter(b => b.status === "REJECTED").length;
  }

  return {
    totalJobs,
    completedJobs,
    onTimeCompletions,
    lateCompletions,
    abandonedJobs,
    jobsWithPhotoProof,
    adminForcedClosures,
    rejectedJobs,
    totalJobOffers,
  };
}

/**
 * Get rating statistics
 */
async function getRatingStatistics(
  userId: string,
  userType: "DEALER" | "TECHNICIAN",
  thirtyDaysAgo: Date
) {
  // Get reviews where this user is the reviewee
  const reviews = await prisma.jobReview.findMany({
    where: {
      revieweeId: userId,
      isHidden: false,
    },
    include: {
      job: true,
    },
  });

  const totalRatings = reviews.length;
  let averageRating = 0;
  let recentLowRatings = 0;

  if (totalRatings > 0) {
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    averageRating = sum / totalRatings;

    // Count recent low ratings (1-2 stars in last 30 days)
    recentLowRatings = reviews.filter(
      r => r.rating <= 2 && 
      new Date(r.createdAt) >= thirtyDaysAgo
    ).length;
  }

  return {
    averageRating,
    totalRatings,
    recentLowRatings,
  };
}

/**
 * Get complaint and dispute statistics
 */
async function getComplaintStatistics(
  userId: string,
  userType: "DEALER" | "TECHNICIAN",
  thirtyDaysAgo: Date
) {
  // Get disputes where this user is involved
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      jobPosts: {
        include: {
          disputes: true,
        },
      },
    },
  });

  let allDisputes: any[] = [];
  if (userType === "DEALER") {
    // Disputes on dealer's jobs
    user?.jobPosts.forEach(job => {
      allDisputes.push(...job.disputes);
    });
  } else {
    // Disputes on jobs assigned to technician
    const technician = await prisma.technician.findUnique({
      where: { userId },
      include: {
        assignedJobs: {
          include: {
            disputes: true,
          },
        },
      },
    });
    technician?.assignedJobs.forEach(job => {
      allDisputes.push(...job.disputes);
    });
  }

  const totalDisputes = allDisputes.length;
  const resolvedDisputes = allDisputes.filter(
    d => d.status === "RESOLVED" || d.status === "CLOSED"
  ).length;
  
  const recentDisputes = allDisputes.filter(
    d => new Date(d.createdAt) >= thirtyDaysAgo
  );

  // For now, treat disputes as complaints
  // In future, you might have a separate Complaint model
  return {
    totalComplaints: totalDisputes,
    recentComplaints: recentDisputes.length,
    totalDisputes,
    resolvedDisputes,
  };
}

/**
 * Get rework statistics
 */
async function getReworkStatistics(
  userId: string,
  userType: "DEALER" | "TECHNICIAN"
) {
  let reworkRequests = 0;

  if (userType === "TECHNICIAN") {
    const technician = await prisma.technician.findUnique({
      where: { userId },
      include: {
        warrantyReworks: {
          where: {
            status: {
              in: ["ISSUE_REPORTED", "REWORK_IN_PROGRESS"],
            },
          },
        },
      },
    });
    reworkRequests = technician?.warrantyReworks.length || 0;
  } else {
    // For dealers, count reworks on their jobs
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobPosts: {
          include: {
            warranties: {
              where: {
                status: {
                  in: ["ISSUE_REPORTED", "REWORK_IN_PROGRESS"],
                },
              },
            },
          },
        },
      },
    });
    user?.jobPosts.forEach(job => {
      reworkRequests += job.warranties.length;
    });
  }

  return {
    reworkRequests,
  };
}

/**
 * Get OTP closure statistics
 */
async function getOtpStatistics(
  userId: string,
  userType: "DEALER" | "TECHNICIAN"
) {
  let customerOtpClosures = 0;
  let dealerOtpClosures = 0;

  if (userType === "TECHNICIAN") {
    const technician = await prisma.technician.findUnique({
      where: { userId },
      include: {
        assignedJobs: {
          where: {
            status: "COMPLETED",
            otpVerifiedAt: {
              not: null,
            },
          },
        },
      },
    });

    technician?.assignedJobs.forEach(job => {
      // Check if customer OTP was used (would need to track OTP source)
      // For now, assume if OTP is verified, it's customer OTP
      // In future, add otpSource field to JobPost
      if (job.otpVerifiedAt) {
        customerOtpClosures++;
      }
    });
  } else {
    // For dealers, count OTP closures on their jobs
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobPosts: {
          where: {
            status: "COMPLETED",
            otpVerifiedAt: {
              not: null,
            },
          },
        },
      },
    });

    user?.jobPosts.forEach(job => {
      if (job.otpVerifiedAt) {
        // Would need to check OTP source
        customerOtpClosures++;
      }
    });
  }

  return {
    customerOtpClosures,
    dealerOtpClosures, // Would need additional tracking
  };
}

/**
 * Update trust score for a user and create history record
 */
export async function updateTrustScore(
  userId: string,
  userType: "DEALER" | "TECHNICIAN",
  newScore: number,
  changeType: "AUTO_INCREASE" | "AUTO_DECREASE" | "MANUAL_INCREASE" | "MANUAL_DECREASE" | "MANUAL_RESET" | "RATING_IMPACT" | "JOB_COMPLETION" | "COMPLAINT_IMPACT" | "DISPUTE_RESOLUTION" | "SYSTEM_RECALCULATION",
  reason: string,
  changedBy?: string,
  jobId?: string,
  ratingId?: string,
  disputeId?: string
): Promise<void> {
  try {
    // Get current score
    let currentScore = 50.0;
    let profile: any = null;
    
    if (userType === "TECHNICIAN") {
      profile = await prisma.technician.findUnique({
        where: { userId },
        select: { trustScore: true },
      });
      currentScore = profile?.trustScore || 50.0;
    } else if (userType === "DEALER") {
      profile = await prisma.dealer.findUnique({
        where: { userId },
        select: { trustScore: true },
      });
      currentScore = profile?.trustScore || 50.0;
    }

    // Clamp new score
    const clampedScore = Math.max(0, Math.min(100, newScore));
    const changeAmount = clampedScore - currentScore;

    // Determine trust score status
    let trustScoreStatus = "NORMAL";
    if (clampedScore >= 80) {
      trustScoreStatus = "GOOD";
    } else if (clampedScore >= 60) {
      trustScoreStatus = "NORMAL";
    } else if (clampedScore >= 40) {
      trustScoreStatus = "RISK";
    } else {
      trustScoreStatus = "CRITICAL";
    }

    // Update profile
    if (userType === "TECHNICIAN") {
      await prisma.technician.update({
        where: { userId },
        data: {
          trustScore: clampedScore,
          trustScoreStatus,
          lastTrustScoreUpdate: new Date(),
        },
      });
    } else if (userType === "DEALER") {
      await prisma.dealer.update({
        where: { userId },
        data: {
          trustScore: clampedScore,
          trustScoreStatus,
          lastTrustScoreUpdate: new Date(),
        },
      });
    }

    // Get admin name if manual change
    let adminName: string | undefined;
    if (changedBy) {
      const admin = await prisma.user.findUnique({
        where: { id: changedBy },
        select: { name: true },
      });
      adminName = admin?.name || undefined;
    }

    // Create history record
    await prisma.trustScoreHistory.create({
      data: {
        userId,
        userType,
        oldScore: currentScore,
        newScore: clampedScore,
        changeAmount,
        changeType: changeType as any,
        reason,
        jobId,
        ratingId,
        disputeId,
        changedBy,
        adminName,
        isManual: !!changedBy,
      },
    });
  } catch (error) {
    console.error("Error updating trust score:", error);
    throw error;
  }
}

/**
 * Recalculate and update trust score for a user
 */
export async function recalculateTrustScore(
  userId: string,
  userType: "DEALER" | "TECHNICIAN"
): Promise<number> {
  const newScore = await calculateTrustScore(userId, userType);
  await updateTrustScore(
    userId,
    userType,
    newScore,
    "SYSTEM_RECALCULATION",
    "Automatic trust score recalculation"
  );
  return newScore;
}




