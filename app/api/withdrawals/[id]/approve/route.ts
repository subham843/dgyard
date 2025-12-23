/**
 * Withdrawal Approval API (Admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDoubleEntry, LedgerAccountType, LedgerEntryCategory } from "@/lib/services/ledger";
import { createAuditLog, AuditLogAction } from "@/lib/services/audit-log";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can approve withdrawals" },
        { status: 403 }
      );
    }

    const { id: withdrawalId } = await params;
    const data = await request.json();
    const { action, transactionId, notes } = data; // action: "approve" or "reject"

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        job: true,
      },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal not found" },
        { status: 404 }
      );
    }

    if (withdrawal.status !== "PENDING") {
      return NextResponse.json(
        { error: `Withdrawal is already ${withdrawal.status}` },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Approve withdrawal
      const updated = await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "APPROVED",
          approvedBy: session.user.id,
          approvedAt: new Date(),
          transactionId: transactionId || null,
          notes: notes || null,
        },
      });

      // Create ledger entry to deduct from technician payable
      // This will be handled when the withdrawal is processed
      // For now, we mark it as approved

      // Create audit log
      await createAuditLog({
        jobId: withdrawal.jobId,
        userId: session.user.id,
        userRole: "ADMIN",
        action: AuditLogAction.WITHDRAWAL_APPROVED,
        description: `Withdrawal approved: ₹${withdrawal.amount} for job ${withdrawal.job.jobNumber}`,
        amount: withdrawal.amount,
        withdrawalId: withdrawalId,
        metadata: {
          transactionId,
          notes,
        },
      });

      return NextResponse.json({
        success: true,
        withdrawal: updated,
        message: "Withdrawal approved",
      });
    } else if (action === "reject") {
      // Reject withdrawal
      const updated = await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "REJECTED",
          approvedBy: session.user.id,
          approvedAt: new Date(),
          notes: notes || null,
        },
      });

      // Create audit log
      await createAuditLog({
        jobId: withdrawal.jobId,
        userId: session.user.id,
        userRole: "ADMIN",
        action: AuditLogAction.WITHDRAWAL_REJECTED,
        description: `Withdrawal rejected: ₹${withdrawal.amount} for job ${withdrawal.job.jobNumber}`,
        amount: withdrawal.amount,
        withdrawalId: withdrawalId,
        metadata: { notes },
      });

      return NextResponse.json({
        success: true,
        withdrawal: updated,
        message: "Withdrawal rejected",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}

/**
 * Process withdrawal (move from approved to completed)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can process withdrawals" },
        { status: 403 }
      );
    }

    const { id: withdrawalId } = await params;
    const data = await request.json();
    const { transactionId, status: newStatus } = data; // status: "PROCESSING" or "COMPLETED" or "FAILED"

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        job: {
          include: {
            technician: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal not found" },
        { status: 404 }
      );
    }

    if (!["APPROVED", "PROCESSING"].includes(withdrawal.status)) {
      return NextResponse.json(
        { error: `Cannot process withdrawal with status: ${withdrawal.status}` },
        { status: 400 }
      );
    }

    const updateData: any = {
      status: newStatus,
    };

    if (newStatus === "COMPLETED") {
      updateData.processedAt = new Date();
      updateData.transactionId = transactionId || withdrawal.transactionId;

      // Create ledger entry to deduct from technician payable
      await createDoubleEntry({
        jobId: withdrawal.jobId,
        debitAccount: {
          userId: withdrawal.job.technician.user.id,
          accountType: LedgerAccountType.TECHNICIAN_PAYABLE,
          amount: withdrawal.amount,
          category: LedgerEntryCategory.WITHDRAWAL,
          description: `Withdrawal processed: ₹${withdrawal.amount} for job ${withdrawal.job.jobNumber}`,
          withdrawalId: withdrawalId,
        },
        creditAccount: {
          userId: undefined, // Bank/Cash account (system account)
          accountType: LedgerAccountType.TECHNICIAN_PAYABLE, // Temporary, this should be a BANK account type
          amount: withdrawal.amount,
          category: LedgerEntryCategory.WITHDRAWAL,
          description: `Withdrawal to bank: ${withdrawal.bankName} - ${withdrawal.accountHolderName}`,
          withdrawalId: withdrawalId,
        },
        createdBy: session.user.id,
      });
    } else if (newStatus === "FAILED") {
      updateData.failureReason = data.failureReason || "Processing failed";
    }

    const updated = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      withdrawal: updated,
      message: `Withdrawal marked as ${newStatus}`,
    });
  } catch (error: any) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}





