/**
 * AI / Automation Engine
 * 
 * Handles:
 * - Risk analysis (technician reliability, dealer dispute frequency)
 * - Auto rules (increase hold % for risky users)
 * - SLA monitoring (missed response, technician inactivity)
 * - Auto-release for low-risk jobs
 */

import { prisma } from "@/lib/prisma";

export interface RiskAnalysisResult {
  technicianRiskScore: number; // 0-100 (0 = no risk, 100 = high risk)
  dealerRiskScore: number; // 0-100
  jobRiskScore: number; // 0-100
  recommendedHoldPercentage: number; // Recommended hold %
  recommendedActions: string[];
}

export interface TechnicianReliabilityMetrics {
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  warrantyComplaints: number;
  disputeCount: number;
  averageRating: number;
  onTimeCompletionRate: number;
  responseTimeAvg: number; // in hours
}

export interface DealerReliabilityMetrics {
  totalJobsPosted: number;
  disputeFrequency: number; // Disputes per job
  paymentDelayRate: number; // % of payments delayed
  cashPaymentFrequency: number; // % of cash payments
  complaintFrequency: number; // Complaints per job
}

/**
 * Calculate technician reliability metrics
 */
export async function calculateTechnicianReliability(technicianId: string): Promise<TechnicianReliabilityMetrics> {
  const technician = await prisma.technician.findUnique({
    where: { id: technicianId },
    include: {
      assignedJobs: {
        include: {
          warranties: true,
          disputes: true,
        },
      },
    },
  });

  if (!technician) {
    throw new Error("Technician not found");
  }

  const jobs = technician.assignedJobs;
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === "COMPLETED").length;
  const cancelledJobs = jobs.filter(j => j.status === "CANCELLED").length;
  
  // Count warranty complaints
  const warrantyComplaints = jobs.reduce((count, job) => {
    return count + job.warranties.filter(w => w.status === "ISSUE_REPORTED").length;
  }, 0);

  // Count disputes
  const disputeCount = jobs.reduce((count, job) => {
    return count + job.disputes.length;
  }, 0);

  // Calculate on-time completion rate
  const onTimeJobs = jobs.filter(job => {
    if (!job.completedAt || !job.scheduledAt) return false;
    const scheduledTime = new Date(job.scheduledAt).getTime();
    const completedTime = new Date(job.completedAt).getTime();
    // Consider on-time if completed within 2 hours of scheduled time
    return completedTime <= scheduledTime + 2 * 60 * 60 * 1000;
  }).length;
  const onTimeCompletionRate = totalJobs > 0 ? (onTimeJobs / totalJobs) * 100 : 100;

  // Calculate average response time (time between job assignment and start)
  const responseTimes = jobs
    .filter(j => j.assignedAt && j.startedAt)
    .map(j => {
      const assigned = new Date(j.assignedAt!).getTime();
      const started = new Date(j.startedAt!).getTime();
      return (started - assigned) / (1000 * 60 * 60); // Convert to hours
    });
  const responseTimeAvg = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  return {
    totalJobs,
    completedJobs,
    cancelledJobs,
    warrantyComplaints,
    disputeCount,
    averageRating: technician.rating || 0,
    onTimeCompletionRate,
    responseTimeAvg,
  };
}

/**
 * Calculate dealer reliability metrics
 */
export async function calculateDealerReliability(dealerId: string): Promise<DealerReliabilityMetrics> {
  const dealer = await prisma.user.findUnique({
    where: { id: dealerId },
    include: {
      jobPosts: {
        include: {
          disputes: true,
          payments: true,
          warranties: {
            where: {
              status: "ISSUE_REPORTED",
            },
          },
        },
      },
    },
  });

  if (!dealer) {
    throw new Error("Dealer not found");
  }

  const jobs = dealer.jobPosts;
  const totalJobsPosted = jobs.length;
  
  // Calculate dispute frequency
  const totalDisputes = jobs.reduce((count, job) => count + job.disputes.length, 0);
  const disputeFrequency = totalJobsPosted > 0 ? totalDisputes / totalJobsPosted : 0;

  // Calculate payment delay rate (payments not paid immediately)
  const allPayments = jobs.flatMap(j => j.payments);
  const delayedPayments = allPayments.filter(p => {
    if (!p.paidAt) return false;
    const paidTime = new Date(p.paidAt).getTime();
    const jobCompleted = jobs.find(j => j.id === p.jobId)?.completedAt;
    if (!jobCompleted) return false;
    const completedTime = new Date(jobCompleted).getTime();
    // Consider delayed if paid more than 24 hours after completion
    return paidTime > completedTime + 24 * 60 * 60 * 1000;
  }).length;
  const paymentDelayRate = allPayments.length > 0 ? (delayedPayments / allPayments.length) * 100 : 0;

  // Calculate cash payment frequency
  const cashPayments = allPayments.filter(p => p.isCashPayment).length;
  const cashPaymentFrequency = allPayments.length > 0 ? (cashPayments / allPayments.length) * 100 : 0;

  // Calculate complaint frequency
  const totalComplaints = jobs.reduce((count, job) => count + job.warranties.length, 0);
  const complaintFrequency = totalJobsPosted > 0 ? totalComplaints / totalJobsPosted : 0;

  return {
    totalJobsPosted,
    disputeFrequency,
    paymentDelayRate,
    cashPaymentFrequency,
    complaintFrequency,
  };
}

/**
 * Calculate risk scores and recommend hold percentage
 */
export async function analyzeJobRisk(
  jobId: string,
  technicianId: string,
  dealerId: string
): Promise<RiskAnalysisResult> {
  // Get reliability metrics
  const technicianMetrics = await calculateTechnicianReliability(technicianId);
  const dealerMetrics = await calculateDealerReliability(dealerId);

  // Calculate technician risk score (0-100)
  let technicianRiskScore = 0;
  
  // Factors that increase risk:
  // - Low completion rate (< 80% = +30 points)
  const completionRate = technicianMetrics.totalJobs > 0
    ? (technicianMetrics.completedJobs / technicianMetrics.totalJobs) * 100
    : 100;
  if (completionRate < 80) technicianRiskScore += 30;
  else if (completionRate < 90) technicianRiskScore += 15;

  // - High cancellation rate (> 20% = +20 points)
  const cancellationRate = technicianMetrics.totalJobs > 0
    ? (technicianMetrics.cancelledJobs / technicianMetrics.totalJobs) * 100
    : 0;
  if (cancellationRate > 20) technicianRiskScore += 20;
  else if (cancellationRate > 10) technicianRiskScore += 10;

  // - Warranty complaints (> 10% = +25 points)
  const complaintRate = technicianMetrics.totalJobs > 0
    ? (technicianMetrics.warrantyComplaints / technicianMetrics.totalJobs) * 100
    : 0;
  if (complaintRate > 10) technicianRiskScore += 25;
  else if (complaintRate > 5) technicianRiskScore += 15;

  // - Disputes (> 15% = +20 points)
  const disputeRate = technicianMetrics.totalJobs > 0
    ? (technicianMetrics.disputeCount / technicianMetrics.totalJobs) * 100
    : 0;
  if (disputeRate > 15) technicianRiskScore += 20;
  else if (disputeRate > 8) technicianRiskScore += 10;

  // - Low rating (< 4.0 = +15 points)
  if (technicianMetrics.averageRating < 4.0) technicianRiskScore += 15;
  else if (technicianMetrics.averageRating < 4.5) technicianRiskScore += 8;

  // - Poor on-time completion (< 70% = +10 points)
  if (technicianMetrics.onTimeCompletionRate < 70) technicianRiskScore += 10;

  // - Slow response time (> 24 hours = +10 points)
  if (technicianMetrics.responseTimeAvg > 24) technicianRiskScore += 10;

  // Calculate dealer risk score (0-100)
  let dealerRiskScore = 0;

  // - High dispute frequency (> 20% = +30 points)
  if (dealerMetrics.disputeFrequency > 0.2) dealerRiskScore += 30;
  else if (dealerMetrics.disputeFrequency > 0.1) dealerRiskScore += 15;

  // - High payment delay rate (> 30% = +25 points)
  if (dealerMetrics.paymentDelayRate > 30) dealerRiskScore += 25;
  else if (dealerMetrics.paymentDelayRate > 15) dealerRiskScore += 12;

  // - High cash payment frequency (> 50% = +20 points)
  if (dealerMetrics.cashPaymentFrequency > 50) dealerRiskScore += 20;
  else if (dealerMetrics.cashPaymentFrequency > 25) dealerRiskScore += 10;

  // - High complaint frequency (> 30% = +25 points)
  if (dealerMetrics.complaintFrequency > 0.3) dealerRiskScore += 25;
  else if (dealerMetrics.complaintFrequency > 0.15) dealerRiskScore += 12;

  // Calculate job risk score (combined)
  const jobRiskScore = (technicianRiskScore + dealerRiskScore) / 2;

  // Recommend hold percentage based on risk
  let recommendedHoldPercentage = 20; // Default 20%
  
  if (jobRiskScore >= 70) {
    recommendedHoldPercentage = 40; // High risk: 40% hold
  } else if (jobRiskScore >= 50) {
    recommendedHoldPercentage = 30; // Medium-high risk: 30% hold
  } else if (jobRiskScore >= 30) {
    recommendedHoldPercentage = 25; // Medium risk: 25% hold
  } else if (jobRiskScore < 15) {
    recommendedHoldPercentage = 15; // Low risk: 15% hold (can be auto-released)
  }

  // Generate recommended actions
  const recommendedActions: string[] = [];
  
  if (jobRiskScore >= 70) {
    recommendedActions.push("Consider manual approval before release");
    recommendedActions.push("Increase warranty hold percentage to 40%");
  } else if (jobRiskScore >= 50) {
    recommendedActions.push("Monitor closely during warranty period");
    recommendedActions.push("Increase warranty hold percentage to 30%");
  }
  
  if (technicianRiskScore >= 50) {
    recommendedActions.push("Technician has elevated risk profile");
  }
  
  if (dealerRiskScore >= 50) {
    recommendedActions.push("Dealer has elevated dispute/complaint frequency");
  }

  if (jobRiskScore < 15) {
    recommendedActions.push("Low risk - eligible for auto-release after warranty period");
  }

  return {
    technicianRiskScore: Math.min(technicianRiskScore, 100),
    dealerRiskScore: Math.min(dealerRiskScore, 100),
    jobRiskScore: Math.min(jobRiskScore, 100),
    recommendedHoldPercentage,
    recommendedActions,
  };
}

/**
 * Check SLA violations
 */
export async function checkSLAViolations(jobId: string) {
  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    include: {
      technician: true,
    },
  });

  if (!job || !job.technician) {
    return { violations: [] };
  }

  const violations: string[] = [];

  // Check if technician hasn't responded/started (24 hours after assignment)
  if (job.status === "ASSIGNED" && job.assignedAt) {
    const assignedTime = new Date(job.assignedAt).getTime();
    const now = Date.now();
    const hoursSinceAssignment = (now - assignedTime) / (1000 * 60 * 60);
    
    if (hoursSinceAssignment > 24) {
      violations.push("Technician has not started job within 24 hours of assignment");
    }
  }

  // Check if job is taking too long (if estimated duration provided)
  if (job.status === "IN_PROGRESS" && job.startedAt && job.estimatedDuration) {
    const startedTime = new Date(job.startedAt).getTime();
    const now = Date.now();
    const hoursSinceStart = (now - startedTime) / (1000 * 60 * 60);
    
    if (hoursSinceStart > job.estimatedDuration * 1.5) {
      violations.push(`Job taking ${hoursSinceStart.toFixed(1)} hours, estimated ${job.estimatedDuration} hours`);
    }
  }

  return { violations };
}

/**
 * Auto-apply rules based on risk analysis
 */
export async function applyAutoRules(
  jobId: string,
  technicianId: string,
  dealerId: string
): Promise<{ holdPercentage: number; actions: string[] }> {
  const riskAnalysis = await analyzeJobRisk(jobId, technicianId, dealerId);
  const slaCheck = await checkSLAViolations(jobId);

  const actions: string[] = [];

  // Apply recommended hold percentage if risk is high
  if (riskAnalysis.jobRiskScore >= 50) {
    actions.push(`Risk-based hold percentage: ${riskAnalysis.recommendedHoldPercentage}%`);
  }

  // Add SLA violations to actions
  if (slaCheck.violations.length > 0) {
    actions.push(...slaCheck.violations);
  }

  return {
    holdPercentage: riskAnalysis.recommendedHoldPercentage,
    actions,
  };
}





