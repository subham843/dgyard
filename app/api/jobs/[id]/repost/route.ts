import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { sendNotification } from "@/lib/notifications";
import { findMatchingTechnicians, sendJobNotifications } from "@/app/api/jobs/route";

const MAX_REPOSTS = 3; // Maximum allowed reposts

/**
 * Repost a job that has timed out or been returned to pool
 * Dealer can repost up to MAX_REPOSTS times, after which job is permanently rejected
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.jobPost.findUnique({
      where: { id },
      include: {
        dealer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Only dealer can repost their own job
    if (job.dealerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if job can be reposted
    const allowedStatuses = [
      JobStatus.JOB_BROADCASTED,
      JobStatus.PENDING,
      JobStatus.NEGOTIATION_FAILED,
    ];

    if (!allowedStatuses.includes(job.status)) {
      return NextResponse.json(
        { error: `Job cannot be reposted from current status: ${job.status}` },
        { status: 400 }
      );
    }

    // Check repost limit
    if (job.repostCount >= job.maxReposts) {
      // Permanently reject the job
      const rejectionReason = `Job exceeded maximum repost limit (${job.maxReposts}). Repeated timeouts indicate issues with job posting.`;
      
      const rejectedJob = await prisma.jobPost.update({
        where: { id },
        data: {
          status: JobStatus.CANCELLED,
          rejectedAt: new Date(),
          rejectionReason: rejectionReason,
          rejectionDetails: {
            reason: "MAX_REPOSTS_EXCEEDED",
            timeoutReasons: job.timeoutReasons || [],
            repostCount: job.repostCount,
            maxReposts: job.maxReposts,
          },
        },
      });

      // Update dealer trust score (decrease by 5 points per rejection)
      const dealer = await prisma.dealer.findUnique({
        where: { userId: job.dealerId },
      });

      if (dealer) {
        const newTrustScore = Math.max(0, (dealer.trustScore || 100) - 5);
        await prisma.dealer.update({
          where: { userId: job.dealerId },
          data: {
            trustScore: newTrustScore,
            rejectedJobsCount: (dealer.rejectedJobsCount || 0) + 1,
          },
        });

        // Notify dealer about trust score impact
        await sendNotification({
          userId: job.dealerId,
          jobId: id,
          type: "JOB_REJECTED",
          title: "Job Permanently Rejected",
          message: `Job ${job.jobNumber} has been permanently rejected due to exceeding repost limit. Your trust score has been reduced by 5 points.`,
          channels: ["IN_APP", "EMAIL"],
          metadata: {
            jobNumber: job.jobNumber,
            rejectionReason,
            trustScoreImpact: -5,
            newTrustScore,
          },
        });
      }

      return NextResponse.json(
        {
          error: "Job cannot be reposted. Maximum repost limit exceeded.",
          job: rejectedJob,
          permanentlyRejected: true,
        },
        { status: 400 }
      );
    }

    // Repost the job
    const updatedJob = await prisma.jobPost.update({
      where: { id },
      data: {
        status: JobStatus.JOB_BROADCASTED,
        repostCount: (job.repostCount || 0) + 1,
        // Clear previous assignments and locks
        assignedTechnicianId: null,
        assignedAt: null,
        softLockedAt: null,
        softLockExpiresAt: null,
        softLockedByTechnicianId: null,
        paymentDeadlineExpiresAt: null,
        negotiationExpiresAt: null,
        // Reset price if needed
        finalPrice: null,
        priceLocked: false,
        negotiationRounds: 0,
      },
    });

    // Re-broadcast to matching technicians
    const matchingTechnicians = await findMatchingTechnicians(updatedJob);
    if (matchingTechnicians.length > 0) {
      await sendJobNotifications(updatedJob, matchingTechnicians);
    }

    // Notify dealer
    await sendNotification({
      userId: job.dealerId,
      jobId: id,
      type: "JOB_REPOSTED",
      title: "Job Reposted",
      message: `Job ${job.jobNumber} has been reposted (${updatedJob.repostCount}/${updatedJob.maxReposts} reposts used).`,
      channels: ["IN_APP"],
      metadata: {
        jobNumber: job.jobNumber,
        repostCount: updatedJob.repostCount,
        maxReposts: updatedJob.maxReposts,
      },
    });

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: `Job reposted successfully (${updatedJob.repostCount}/${updatedJob.maxReposts} reposts used)`,
      repostCount: updatedJob.repostCount,
      maxReposts: updatedJob.maxReposts,
      remainingReposts: updatedJob.maxReposts - updatedJob.repostCount,
    });
  } catch (error: any) {
    console.error("Error reposting job:", error);
    return NextResponse.json(
      { error: error.message || "Failed to repost job" },
      { status: 500 }
    );
  }
}

