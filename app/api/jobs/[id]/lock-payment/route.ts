/**
 * Lock Payment API
 * 
 * When dealer pays after technician accepts job:
 * 1. Payment is locked in escrow/wallet
 * 2. Job status changes from WAITING_FOR_PAYMENT to ASSIGNED
 * 3. Payment will be released after job completion and approval
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LedgerAccountType, LedgerEntryCategory } from "@prisma/client";
import { createDoubleEntry } from "@/lib/services/ledger";
import { AuditLogAction } from "@prisma/client";
import { createAuditLog } from "@/lib/services/audit-log";
import { validateJobStateForOperation, validateStateTransition } from "@/lib/services/job-state-validator";

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "DEALER") {
      return NextResponse.json(
        { error: "Only dealers can lock payments" },
        { status: 403 }
      );
    }

    // Get job details
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        technician: true,
        dealer: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify job belongs to dealer
    if (job.dealerId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to lock payment for this job" },
        { status: 403 }
      );
    }

    if (!job.assignedTechnicianId) {
      return NextResponse.json(
        { error: "Job has no assigned technician" },
        { status: 400 }
      );
    }

    const totalAmount = data.totalAmount || job.finalPrice || job.estimatedCost || 0;

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Get technician user ID for metadata
    const technician = await prisma.technician.findUnique({
      where: { id: job.assignedTechnicianId },
      include: { user: { select: { id: true, name: true } } },
    });

    // Check if ledger entries already exist for this job payment (prevent duplicates)
    // Do this BEFORE status check to handle idempotent requests
    const existingLedgerEntry = await prisma.ledgerEntry.findFirst({
      where: {
        jobId,
        category: LedgerEntryCategory.JOB_PAYMENT,
        entryType: "DEBIT",
        account: {
          accountType: LedgerAccountType.DEALER_WALLET,
          userId: job.dealerId,
        },
      },
    });

    // If entries already exist, treat as success (idempotent)
    // But ensure job status is updated if still WAITING_FOR_PAYMENT
    if (existingLedgerEntry) {
      let existingJob = await prisma.jobPost.findUnique({
        where: { id: jobId },
      });

      // If job status is still WAITING_FOR_PAYMENT, update it to ASSIGNED
      if (existingJob && existingJob.status === "WAITING_FOR_PAYMENT") {
        existingJob = await prisma.jobPost.update({
          where: { id: jobId },
          data: {
            status: "ASSIGNED",
          },
        });
        console.log("Updated job status from WAITING_FOR_PAYMENT to ASSIGNED for job", jobId);
      }

      return NextResponse.json({
        success: true,
        job: existingJob,
        message: "Payment already processed",
        alreadyProcessed: true,
      });
    }

    // Validate state for lock_payment operation
    const stateValidation = validateJobStateForOperation(job.status, "lock_payment");
    if (!stateValidation.valid) {
      return NextResponse.json({ error: stateValidation.error }, { status: 400 });
    }

    // Validate state transition
    const transitionValidation = validateStateTransition(job.status, "ASSIGNED");
    if (!transitionValidation.valid) {
      return NextResponse.json({ error: transitionValidation.error }, { status: 400 });
    }

    // Create escrow entry in ledger (lock payment)
    // DEBIT: Dealer's wallet (money goes out)
    // CREDIT: Escrow account (money locked for technician)
    try {
      await createDoubleEntry({
        jobId,
        debitAccount: {
          userId: job.dealerId,
          accountType: LedgerAccountType.DEALER_WALLET,
          amount: totalAmount,
          category: LedgerEntryCategory.JOB_PAYMENT,
          description: `Payment locked for job ${job.jobNumber}`,
          metadata: {
            paymentMethod: data.paymentMethod || "ONLINE",
            razorpayOrderId: data.razorpayOrderId,
            razorpayPaymentId: data.razorpayPaymentId,
            cashProofUrl: data.cashProofUrl,
            lockedAt: new Date().toISOString(),
            jobNumber: job.jobNumber,
          },
        },
        creditAccount: {
          userId: undefined, // Escrow is system account
          accountType: LedgerAccountType.ESCROW,
          amount: totalAmount,
          category: LedgerEntryCategory.JOB_PAYMENT,
          description: `Escrow payment for job ${job.jobNumber} - Locked for technician: ${technician?.user?.name || "N/A"}`,
          metadata: {
            jobId: jobId,
            jobNumber: job.jobNumber,
            technicianId: job.assignedTechnicianId,
            technicianUserId: technician?.user?.id,
            technicianName: technician?.user?.name,
            dealerId: job.dealerId,
            paymentMethod: data.paymentMethod || "ONLINE",
            razorpayOrderId: data.razorpayOrderId,
            razorpayPaymentId: data.razorpayPaymentId,
            lockedAt: new Date().toISOString(),
            status: "LOCKED_FOR_TECHNICIAN",
          },
        },
        createdBy: session.user.id,
      });
    } catch (entryError: any) {
      // If entries already exist or unique constraint violation, treat as success (idempotent)
      if (
        entryError.message?.includes("already exist") ||
        entryError.message?.includes("Unique constraint") ||
        entryError.message?.includes("counterEntryId") ||
        entryError.code === "P2002" // Prisma unique constraint error code
      ) {
        let existingJob = await prisma.jobPost.findUnique({
          where: { id: jobId },
        });

        // If job status is still WAITING_FOR_PAYMENT, update it to ASSIGNED
        if (existingJob && existingJob.status === "WAITING_FOR_PAYMENT") {
          existingJob = await prisma.jobPost.update({
            where: { id: jobId },
            data: {
              status: "ASSIGNED",
            },
          });
        }

        console.log("Payment entries already exist for job", jobId, "- treating as success, status:", existingJob?.status);
        return NextResponse.json({
          success: true,
          job: existingJob,
          message: "Payment already processed",
          alreadyProcessed: true,
        });
      }
      // Re-throw other errors
      throw entryError;
    }

    // Update job status to ASSIGNED (payment locked, job can proceed)
    const updatedJob = await prisma.jobPost.update({
      where: { id: jobId },
      data: {
        status: "ASSIGNED",
      },
    });

    // Create audit log
    await createAuditLog({
      jobId,
      userId: session.user.id,
      userRole: "DEALER",
      action: AuditLogAction.PAYMENT_CREATED,
      description: `Payment locked in escrow: ₹${totalAmount} for job ${job.jobNumber}`,
      amount: totalAmount,
      metadata: {
        paymentMethod: data.paymentMethod || "ONLINE",
        status: "LOCKED_IN_ESCROW",
      },
    });

    // Notify technician
    const { sendNotification } = await import("@/lib/notifications");
    if (job.technician?.userId) {
      await sendNotification({
        userId: job.technician.userId,
        jobId: jobId,
        type: "JOB_PAYMENT_LOCKED",
        title: "Payment Received!",
        message: `Dealer has locked payment for job ${job.jobNumber}. You can now proceed with the job.`,
        channels: ["IN_APP", "EMAIL", "WHATSAPP"],
        metadata: { jobNumber: job.jobNumber },
      });
    }

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: "Payment Locked Successfully. Your payment has been secured by D.G.Yard. The technician will be paid after job completion and approval.",
    });
  } catch (error: any) {
    console.error("Error locking payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to lock payment" },
      { status: 500 }
    );
  }
}

