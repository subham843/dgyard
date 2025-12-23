/**
 * Job Approval API
 * 
 * When dealer/customer approves job completion:
 * 1. Job status changes to COMPLETED
 * 2. Warranty timer starts
 * 3. Payment split is created
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentSplit, releasePaymentFromEscrow } from "@/lib/services/payment-split";
import { applyAutoRules } from "@/lib/services/ai-automation";
import { LedgerAccountType } from "@prisma/client";
import { sendNotification } from "@/lib/notifications";
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only dealers, customers, or admins can approve jobs
    if (user.role !== "DEALER" && user.role !== "ADMIN" && user.role !== "USER") {
      return NextResponse.json(
        { error: "Only dealers, customers, or admins can approve jobs" },
        { status: 403 }
      );
    }

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

    // Validate state for approve operation
    const stateValidation = validateJobStateForOperation(job.status, "approve");
    if (!stateValidation.valid) {
      return NextResponse.json({ error: stateValidation.error }, { status: 400 });
    }

    // Validate state transition
    const transitionValidation = validateStateTransition(job.status, "COMPLETED");
    if (!transitionValidation.valid) {
      return NextResponse.json({ error: transitionValidation.error }, { status: 400 });
    }

    // Check permissions: dealer can approve their own jobs, customers can approve (if we track customer user), admin can approve any
    if (user.role === "DEALER" && job.dealerId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to approve this job" },
        { status: 403 }
      );
    }

    if (!job.assignedTechnicianId) {
      return NextResponse.json(
        { error: "Job has no assigned technician" },
        { status: 400 }
      );
    }

    // Update job status to COMPLETED and set warranty start date
    const updatedJob = await prisma.jobPost.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        warrantyStartDate: new Date(), // Warranty starts from approval date
      },
    });

    // Update technician stats
    if (job.assignedTechnicianId) {
      await prisma.technician.update({
        where: { id: job.assignedTechnicianId },
        data: {
          completedJobs: { increment: 1 },
        },
      });
    }

    // Get job amount
    const totalAmount = parseFloat(data.totalAmount) || job.finalPrice || job.estimatedCost || 0;

    if (!totalAmount || totalAmount <= 0 || isNaN(totalAmount)) {
      return NextResponse.json(
        { error: "Job amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Get hold percentage (from request, job settings, or AI recommendation)
    let holdPercentage = data.holdPercentage 
      ? parseFloat(data.holdPercentage) 
      : 20; // Default 20%
    
    if (holdPercentage < 0 || holdPercentage > 100 || isNaN(holdPercentage)) {
      holdPercentage = 20; // Reset to default if invalid
    }

    // Default warranty hold: 20% for 10 days (as per requirement)
    const warrantyDays = data.warrantyDays 
      ? parseInt(data.warrantyDays) 
      : 10; // Changed to 10 days default
    
    if (warrantyDays < 0 || isNaN(warrantyDays)) {
      return NextResponse.json(
        { error: "Warranty days must be a positive number" },
        { status: 400 }
      );
    }

    // If not specified, get AI recommendation
    if (!data.holdPercentage && job.assignedTechnicianId) {
      try {
        const autoRules = await applyAutoRules(jobId, job.assignedTechnicianId, job.dealerId);
        holdPercentage = autoRules.holdPercentage;
      } catch (error) {
        console.error("Error getting AI recommendation:", error);
        // Use default if AI fails
      }
    }

    // Check if payment is locked in escrow
    const { getLedgerAccountBalance } = await import("@/lib/services/ledger");
    const escrowBalance = await getLedgerAccountBalance(
      jobId,
      undefined,
      LedgerAccountType.ESCROW
    );

    // Release payment from escrow and create payment split
    let paymentSplit;
    try {
      if (escrowBalance > 0) {
        // Payment is in escrow - release it (80% to technician, 20% to warranty hold for 10 days)
        paymentSplit = await releasePaymentFromEscrow({
          jobId,
          totalAmount,
          holdPercentage,
          warrantyDays: 10, // 10 days as per requirement
          technicianId: job.assignedTechnicianId,
          dealerId: job.dealerId,
          commissionRate: data.commissionRate || 5,
          createdBy: user.role === "ADMIN" ? user.id : undefined,
        });
        
        // Ensure payment is marked as released and technician wallet is updated
        console.log(`Payment released from escrow for job ${jobId}:`, {
          immediateAmount: paymentSplit.immediateAmount,
          netAmount: paymentSplit.netAmount,
          warrantyHoldAmount: paymentSplit.warrantyHoldAmount,
        });
      } else {
        // No escrow - create payment split normally (for backward compatibility)
        paymentSplit = await createPaymentSplit({
          jobId,
          totalAmount,
          holdPercentage,
          warrantyDays,
          technicianId: job.assignedTechnicianId,
          dealerId: job.dealerId,
          commissionRate: data.commissionRate || 5,
          paymentMethod: data.paymentMethod || "ONLINE",
          cashProofUrl: data.cashProofUrl,
          razorpayOrderId: data.razorpayOrderId,
          razorpayPaymentId: data.razorpayPaymentId,
          createdBy: user.role === "ADMIN" ? user.id : undefined,
        });
      }
    } catch (error: any) {
      console.error("Error processing payment split:", error);
      // Rollback job status if payment split fails
      await prisma.jobPost.update({
        where: { id: jobId },
        data: { status: "COMPLETION_PENDING_APPROVAL" },
      });
      throw error;
    }

    // Send notification to technician about payment credit (80% immediate, 20% on hold)
    if (paymentSplit && job.assignedTechnicianId) {
      try {
        const technician = await prisma.technician.findUnique({
          where: { id: job.assignedTechnicianId },
          include: { user: true },
        });

        if (technician?.user) {
          const immediateAmount = paymentSplit.netAmount || paymentSplit.immediateAmount || 0;
          const warrantyHoldAmount = paymentSplit.warrantyHoldAmount || 0;

          await sendNotification({
            userId: technician.user.id,
            jobId: jobId,
            type: "PAYMENT_RELEASED",
            title: "Payment Credited to Wallet",
            message: `₹${immediateAmount.toLocaleString('en-IN')} has been credited to your wallet. ₹${warrantyHoldAmount.toLocaleString('en-IN')} is on hold and will be released after warranty completion.`,
            channels: ["IN_APP", "EMAIL", "WHATSAPP"],
            metadata: {
              jobNumber: job.jobNumber,
              immediateAmount,
              warrantyHoldAmount,
              totalAmount: immediateAmount + warrantyHoldAmount,
            },
          });
        }
      } catch (notifError) {
        console.error("Error sending payment notification to technician:", notifError);
        // Don't fail the approval if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      job: updatedJob,
      paymentSplit,
      message: "Job approved and payment split created successfully",
    });
  } catch (error: any) {
    console.error("Error approving job:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve job" },
      { status: 500 }
    );
  }
}

