/**
 * Background Tasks for Job Management
 * 
 * Handles:
 * - Soft lock expiry (auto-release)
 * - Payment deadline expiry (return job to pool)
 * - Negotiation timeout (auto-reject bids)
 * - Warranty hold release (auto-release after expiry)
 */

import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";
import { LedgerAccountType, LedgerEntryCategory } from "@prisma/client";
import { getLedgerAccountBalance } from "./ledger";
import { createDoubleEntry } from "./ledger";

/**
 * Check and release expired soft locks
 * Should be called every 10 seconds
 */
export async function checkAndReleaseExpiredSoftLocks() {
  try {
    const now = new Date();
    
    // Find jobs with expired soft locks
    const expiredSoftLocks = await prisma.jobPost.findMany({
      where: {
        status: "SOFT_LOCKED",
        softLockExpiresAt: {
          lte: now,
        },
      },
      include: {
        technician: {
          include: {
            user: true,
          },
        },
        dealer: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const job of expiredSoftLocks) {
      // Track timeout reason
      const timeoutReasons = job.timeoutReasons || [];
      if (!timeoutReasons.includes("SOFT_LOCK_TIMEOUT")) {
        timeoutReasons.push("SOFT_LOCK_TIMEOUT");
      }

      // Release soft lock and return job to pool
      await prisma.jobPost.update({
        where: { id: job.id },
        data: {
          status: "JOB_BROADCASTED", // Return to broadcasted state
          softLockedAt: null,
          softLockExpiresAt: null,
          softLockedByTechnicianId: null,
          assignedTechnicianId: null, // Unassign technician
          timeoutReasons: timeoutReasons,
        },
      });

      // Notify technician that soft lock expired
      if (job.softLockedByTechnicianId && job.technician?.user) {
        await sendNotification({
          userId: job.technician.user.id,
          jobId: job.id,
          type: "JOB_SOFT_LOCK_EXPIRED",
          title: "Job Soft Lock Expired",
          message: `The soft lock on job ${job.jobNumber} has expired. The job has been returned to the pool. You can try accepting it again.`,
          channels: ["IN_APP"],
          metadata: {
            jobNumber: job.jobNumber,
            jobId: job.id,
          },
        });
      }

      console.log(`Released expired soft lock for job ${job.jobNumber}`);
    }

    return { released: expiredSoftLocks.length };
  } catch (error) {
    console.error("Error checking expired soft locks:", error);
    return { released: 0, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Check and handle expired payment deadlines
 * Should be called every minute
 */
export async function checkAndHandleExpiredPaymentDeadlines() {
  try {
    const now = new Date();
    
    // Find jobs with expired payment deadlines
    const expiredPayments = await prisma.jobPost.findMany({
      where: {
        status: "WAITING_FOR_PAYMENT",
        paymentDeadlineAt: {
          lte: now,
        },
      },
      include: {
        technician: {
          include: {
            user: true,
          },
        },
        dealer: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const job of expiredPayments) {
      // Track timeout reason
      const timeoutReasons = job.timeoutReasons || [];
      if (!timeoutReasons.includes("PAYMENT_DEADLINE_TIMEOUT")) {
        timeoutReasons.push("PAYMENT_DEADLINE_TIMEOUT");
      }

      // Return job to pool
      const rejectedTechnicianId = job.assignedTechnicianId;
      
      await prisma.jobPost.update({
        where: { id: job.id },
        data: {
          status: "JOB_BROADCASTED", // Return to broadcasted state
          assignedTechnicianId: null,
          assignedAt: null,
          finalPrice: null,
          priceLocked: false,
          paymentDeadlineExpiresAt: null,
          // Track rejection for cooldown
          rejectedTechnicianIds: rejectedTechnicianId 
            ? [...(job.rejectedTechnicianIds || []), rejectedTechnicianId]
            : job.rejectedTechnicianIds || [],
          lastRejectedAt: new Date(),
          reCirculationCount: (job.reCirculationCount || 0) + 1,
          timeoutReasons: timeoutReasons,
        },
      });

      // Notify technician
      if (rejectedTechnicianId && job.technician?.user) {
        await sendNotification({
          userId: job.technician.user.id,
          jobId: job.id,
          type: "JOB_PAYMENT_DEADLINE_EXPIRED",
          title: "Payment Deadline Expired",
          message: `The payment deadline for job ${job.jobNumber} has expired. The job has been returned to the pool.`,
          channels: ["IN_APP", "EMAIL"],
          metadata: {
            jobNumber: job.jobNumber,
            jobId: job.id,
          },
        });
      }

      // Notify dealer
      if (job.dealer?.user) {
        await sendNotification({
          userId: job.dealerId,
          jobId: job.id,
          type: "JOB_PAYMENT_DEADLINE_EXPIRED",
          title: "Payment Deadline Expired",
          message: `The payment deadline for job ${job.jobNumber} has expired. The job has been returned to the pool.`,
          channels: ["IN_APP", "EMAIL"],
          metadata: {
            jobNumber: job.jobNumber,
            jobId: job.id,
          },
        });
      }

      console.log(`Handled expired payment deadline for job ${job.jobNumber}`);
    }

    return { handled: expiredPayments.length };
  } catch (error) {
    console.error("Error checking expired payment deadlines:", error);
    return { handled: 0, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Check and auto-reject expired bids (negotiation timeout)
 * Should be called every minute
 */
export async function checkAndAutoRejectExpiredBids() {
  try {
    const now = new Date();
    const negotiationTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Find bids that are pending and expired (created more than 5 minutes ago)
    const expiredBids = await prisma.jobBid.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          lte: new Date(now.getTime() - negotiationTimeout),
        },
        autoRejectedAt: null, // Not already auto-rejected
      },
      include: {
        job: {
          include: {
            dealer: {
              include: {
                user: true,
              },
            },
          },
        },
        technician: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const bid of expiredBids) {
      // Auto-reject the bid
      await prisma.jobBid.update({
        where: { id: bid.id },
        data: {
          status: "EXPIRED",
          autoRejectedAt: now,
        },
      });

      // Check if this was the last pending bid for the job
      const remainingPendingBids = await prisma.jobBid.count({
        where: {
          jobId: bid.jobId,
          status: "PENDING",
        },
      });

      // If no more pending bids, return job to pool (if in negotiation)
      if (remainingPendingBids === 0 && bid.job.status === "PENDING") {
        // Job is already PENDING, no need to change status
        // But we can track that negotiation failed
        await prisma.jobPost.update({
          where: { id: bid.jobId },
          data: {
            reCirculationCount: (bid.job.reCirculationCount || 0) + 1,
          },
        });
      }

      // Notify technician
      if (bid.technician?.user) {
        await sendNotification({
          userId: bid.technician.user.id,
          jobId: bid.jobId,
          type: "JOB_BID_EXPIRED",
          title: "Bid Expired",
          message: `Your bid for job ${bid.job.jobNumber} has expired (no response from dealer within 5 minutes). The job has been returned to the pool.`,
          channels: ["IN_APP"],
          metadata: {
            jobNumber: bid.job.jobNumber,
            jobId: bid.jobId,
            bidId: bid.id,
          },
        });
      }

      // Notify dealer
      if (bid.job.dealer?.user) {
        await sendNotification({
          userId: bid.job.dealerId,
          jobId: bid.jobId,
          type: "JOB_BID_EXPIRED",
          title: "Bid Expired",
          message: `A bid for job ${bid.job.jobNumber} has expired (no response within 5 minutes).`,
          channels: ["IN_APP"],
          metadata: {
            jobNumber: bid.job.jobNumber,
            jobId: bid.jobId,
            bidId: bid.id,
          },
        });
      }

      console.log(`Auto-rejected expired bid ${bid.id} for job ${bid.job.jobNumber}`);
    }

    return { rejected: expiredBids.length };
  } catch (error) {
    console.error("Error checking expired bids:", error);
    return { rejected: 0, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Check and release expired warranty holds
 * Should be called every hour
 */
export async function checkAndReleaseExpiredWarrantyHolds() {
  try {
    const now = new Date();
    
    // Find warranty holds that have expired
    const expiredHolds = await prisma.warrantyHold.findMany({
      where: {
        status: "LOCKED",
        effectiveEndDate: {
          lte: now,
        },
      },
      include: {
        job: {
          include: {
            technician: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    for (const hold of expiredHolds) {
      // Check if there are any active complaints/disputes
      const activeDisputes = await prisma.dispute.count({
        where: {
          jobId: hold.jobId,
          status: { in: ["OPEN", "UNDER_REVIEW"] },
        },
      });

      if (activeDisputes > 0) {
        // Don't release if there are active disputes
        console.log(`Skipping warranty hold release for job ${hold.job.jobNumber} - active disputes`);
        continue;
      }

      // Release warranty hold to technician
      const technicianUserId = hold.job.technician?.user?.id;
      if (!technicianUserId) {
        console.error(`Cannot release warranty hold - technician user not found for job ${hold.jobId}`);
        continue;
      }

      // Create ledger entry: WARRANTY_HOLD → TECHNICIAN_PAYABLE
      await createDoubleEntry({
        jobId: hold.jobId,
        debitAccount: {
          userId: undefined, // WARRANTY_HOLD is system account
          accountType: LedgerAccountType.WARRANTY_HOLD,
          amount: hold.holdAmount,
          category: LedgerEntryCategory.WARRANTY_HOLD,
          description: `Warranty hold released for job ${hold.job.jobNumber}`,
          warrantyHoldId: hold.id,
        },
        creditAccount: {
          userId: technicianUserId,
          accountType: LedgerAccountType.TECHNICIAN_PAYABLE,
          amount: hold.holdAmount,
          category: LedgerEntryCategory.WARRANTY_HOLD,
          description: `Warranty hold released for job ${hold.job.jobNumber} - final payment`,
          warrantyHoldId: hold.id,
        },
      });

      // Update warranty hold status
      await prisma.warrantyHold.update({
        where: { id: hold.id },
        data: {
          status: "RELEASED",
          releasedAt: now,
          releasedBy: undefined, // System auto-release
          releaseReason: "Warranty period expired - automatic release",
        },
      });

      // Update job payment status
      await prisma.jobPayment.updateMany({
        where: {
          jobId: hold.jobId,
          warrantyHoldReleaseDate: {
            lte: now,
          },
        },
        data: {
          status: "RELEASED",
        },
      });

      // Notify technician
      if (hold.job.technician?.user) {
        await sendNotification({
          userId: technicianUserId,
          jobId: hold.jobId,
          type: "WARRANTY_HOLD_RELEASED",
          title: "Warranty Hold Released",
          message: `₹${hold.holdAmount.toLocaleString('en-IN')} warranty hold for job ${hold.job.jobNumber} has been released to your wallet.`,
          channels: ["IN_APP", "EMAIL"],
          metadata: {
            jobNumber: hold.job.jobNumber,
            jobId: hold.jobId,
            warrantyHoldId: hold.id,
            amount: hold.holdAmount,
          },
        });
      }

      console.log(`Released warranty hold ${hold.id} for job ${hold.job.jobNumber}`);
    }

    return { released: expiredHolds.length };
  } catch (error) {
    console.error("Error checking expired warranty holds:", error);
    return { released: 0, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Run all background tasks
 * Should be called periodically (e.g., every minute via cron)
 */
export async function runAllBackgroundTasks() {
  const results = {
    softLocks: await checkAndReleaseExpiredSoftLocks(),
    paymentDeadlines: await checkAndHandleExpiredPaymentDeadlines(),
    expiredBids: await checkAndAutoRejectExpiredBids(),
    warrantyHolds: await checkAndReleaseExpiredWarrantyHolds(),
  };

  return results;
}

