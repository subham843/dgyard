/**
 * Job Cancellation API
 * 
 * Handles job cancellation with penalty rules and trust score impact
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";
import { LedgerAccountType, LedgerEntryCategory, AuditLogAction } from "@prisma/client";
import { getLedgerAccountBalance } from "@/lib/services/ledger";
import { createDoubleEntry } from "@/lib/services/ledger";
import { createAuditLog } from "@/lib/services/audit-log";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;
    const data = await request.json();
    const { reason, penaltyAmount } = data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only dealers, technicians (for their assigned jobs), or admins can cancel
    if (user.role !== "DEALER" && user.role !== "TECHNICIAN" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only dealers, technicians, or admins can cancel jobs" },
        { status: 403 }
      );
    }

    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
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

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check permissions
    if (user.role === "DEALER" && job.dealerId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to cancel this job" },
        { status: 403 }
      );
    }

    if (user.role === "TECHNICIAN" && job.assignedTechnicianId) {
      const technician = await prisma.technician.findUnique({
        where: { userId: session.user.id },
      });
      if (technician?.id !== job.assignedTechnicianId) {
        return NextResponse.json(
          { error: "Unauthorized to cancel this job" },
          { status: 403 }
        );
      }
    }

    // Cannot cancel if already completed
    if (job.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot cancel a completed job" },
        { status: 400 }
      );
    }

    // Calculate penalty based on cancellation timing
    let calculatedPenalty = 0;
    const totalAmount = job.finalPrice || job.estimatedCost || 0;

    if (job.status === "WAITING_FOR_PAYMENT" || job.status === "ASSIGNED") {
      // Cancellation before work starts: 5% penalty
      calculatedPenalty = totalAmount * 0.05;
    } else if (job.status === "IN_PROGRESS") {
      // Cancellation after work started: 20% penalty
      calculatedPenalty = totalAmount * 0.20;
    } else if (job.status === "COMPLETION_PENDING_APPROVAL") {
      // Cancellation after completion: 50% penalty
      calculatedPenalty = totalAmount * 0.50;
    }

    // Use provided penalty or calculated penalty
    const finalPenalty = penaltyAmount || calculatedPenalty;

    // Handle refund if payment was made
    let refundAmount = 0;
    if (job.status === "ASSIGNED" || job.status === "IN_PROGRESS" || job.status === "COMPLETION_PENDING_APPROVAL") {
      // Check escrow balance
      const escrowBalance = await getLedgerAccountBalance(
        jobId,
        undefined,
        LedgerAccountType.ESCROW
      );

      if (escrowBalance > 0) {
        // Refund dealer (total - penalty)
        refundAmount = totalAmount - finalPenalty;
        
        // Create refund ledger entry
        await createDoubleEntry({
          jobId,
          debitAccount: {
            userId: undefined, // ESCROW
            accountType: LedgerAccountType.ESCROW,
            amount: refundAmount,
            category: LedgerEntryCategory.REFUND,
            description: `Refund to dealer for cancelled job ${job.jobNumber} (after penalty deduction)`,
          },
          creditAccount: {
            userId: job.dealerId,
            accountType: LedgerAccountType.DEALER_WALLET,
            amount: refundAmount,
            category: LedgerEntryCategory.REFUND,
            description: `Refund for cancelled job ${job.jobNumber}`,
          },
        });

        // If penalty > 0, move penalty to platform commission
        if (finalPenalty > 0) {
          await createDoubleEntry({
            jobId,
            debitAccount: {
              userId: undefined, // ESCROW
              accountType: LedgerAccountType.ESCROW,
              amount: finalPenalty,
              category: LedgerEntryCategory.REFUND,
              description: `Penalty for cancelled job ${job.jobNumber}`,
            },
            creditAccount: {
              userId: undefined, // Platform
              accountType: LedgerAccountType.PLATFORM_COMMISSION,
              amount: finalPenalty,
              category: LedgerEntryCategory.REFUND,
              description: `Penalty from cancelled job ${job.jobNumber}`,
            },
          });
        }
      }
    }

    // Update job status
    const updatedJob = await prisma.jobPost.update({
      where: { id: jobId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason || "No reason provided",
        cancellationPenalty: finalPenalty,
        cancelledBy: user.id,
        cancelledByRole: user.role,
        // Clear assignment if technician cancelled
        ...(user.role === "TECHNICIAN" && {
          assignedTechnicianId: null,
          assignedAt: null,
        }),
      },
    });

    // Impact trust score
    if (user.role === "TECHNICIAN" && job.assignedTechnicianId) {
      // Technician cancellation: reduce technician trust score
      const technician = await prisma.technician.findUnique({
        where: { id: job.assignedTechnicianId },
      });

      if (technician) {
        // Reduce rating by 0.5 (minimum 0)
        const newRating = Math.max(0, (technician.rating || 0) - 0.5);
        await prisma.technician.update({
          where: { id: technician.id },
          data: {
            rating: newRating,
          },
        });
      }
    } else if (user.role === "DEALER") {
      // Dealer cancellation: reduce dealer trust score (if we track it)
      // For now, just log it
      console.log(`Dealer ${job.dealerId} cancelled job ${job.jobNumber} - trust score impact logged`);
    }

    // Create audit log
    await createAuditLog({
      jobId,
      userId: user.id,
      userRole: user.role,
      action: AuditLogAction.ADMIN_OVERRIDE, // Using this as cancellation action
      description: `Job ${job.jobNumber} cancelled by ${user.role}. Reason: ${reason || "No reason"}. Penalty: ₹${finalPenalty.toLocaleString('en-IN')}. Refund: ₹${refundAmount.toLocaleString('en-IN')}`,
      amount: finalPenalty,
      metadata: {
        cancellationReason: reason,
        penalty: finalPenalty,
        refundAmount,
        cancelledBy: user.id,
        cancelledByRole: user.role,
      },
    });

    // Notify all parties
    if (job.technician?.user && job.assignedTechnicianId) {
      await sendNotification({
        userId: job.technician.user.id,
        jobId: jobId,
        type: "JOB_CANCELLED",
        title: "Job Cancelled",
        message: `Job ${job.jobNumber} has been cancelled by ${user.role === "DEALER" ? "dealer" : "you"}. ${finalPenalty > 0 ? `Penalty: ₹${finalPenalty.toLocaleString('en-IN')}` : ""}`,
        channels: ["IN_APP", "EMAIL"],
        metadata: {
          jobNumber: job.jobNumber,
          jobId: jobId,
          cancelledBy: user.role,
          penalty: finalPenalty,
        },
      });
    }

    if (job.dealer?.user) {
      await sendNotification({
        userId: job.dealerId,
        jobId: jobId,
        type: "JOB_CANCELLED",
        title: "Job Cancelled",
        message: `Job ${job.jobNumber} has been cancelled by ${user.role === "TECHNICIAN" ? "technician" : "you"}. ${refundAmount > 0 ? `Refund: ₹${refundAmount.toLocaleString('en-IN')}` : ""} ${finalPenalty > 0 ? `Penalty: ₹${finalPenalty.toLocaleString('en-IN')}` : ""}`,
        channels: ["IN_APP", "EMAIL"],
        metadata: {
          jobNumber: job.jobNumber,
          jobId: jobId,
          cancelledBy: user.role,
          refundAmount,
          penalty: finalPenalty,
        },
      });
    }

    return NextResponse.json({
      success: true,
      job: updatedJob,
      penalty: finalPenalty,
      refundAmount,
      message: "Job cancelled successfully",
    });
  } catch (error: any) {
    console.error("Error cancelling job:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel job" },
      { status: 500 }
    );
  }
}

