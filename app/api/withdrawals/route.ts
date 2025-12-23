/**
 * Withdrawals API
 * 
 * Handles technician withdrawal requests
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLedgerAccountBalance, LedgerAccountType } from "@/lib/services/ledger";
import { createAuditLog, AuditLogAction } from "@/lib/services/audit-log";

/**
 * Create withdrawal request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { technicianProfile: true },
    });

    if (!user || user.role !== "TECHNICIAN" || !user.technicianProfile) {
      return NextResponse.json(
        { error: "Only technicians can create withdrawal requests" },
        { status: 403 }
      );
    }

    const data = await request.json();
    const {
      jobId,
      amount,
      bankAccountNumber,
      bankIFSC,
      bankName,
      accountHolderName,
    } = data;

    // Validate required fields
    if (!jobId || !amount || !bankAccountNumber || !bankIFSC || !bankName || !accountHolderName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const withdrawalAmount = parseFloat(amount);
    if (!withdrawalAmount || withdrawalAmount <= 0 || isNaN(withdrawalAmount)) {
      return NextResponse.json(
        { error: "Withdrawal amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Validate IFSC format (11 characters, alphanumeric)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(bankIFSC.trim().toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid IFSC code format. Format: AAAA0XXXXXX (e.g., SBIN0001234)" },
        { status: 400 }
      );
    }

    // Validate bank account number (should be numeric, 9-18 digits)
    if (!/^\d{9,18}$/.test(bankAccountNumber.trim())) {
      return NextResponse.json(
        { error: "Invalid bank account number. Must be 9-18 digits" },
        { status: 400 }
      );
    }

    // Check job exists and belongs to technician
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        warrantyHolds: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.assignedTechnicianId !== user.technicianProfile.id) {
      return NextResponse.json(
        { error: "Job does not belong to this technician" },
        { status: 403 }
      );
    }

    // Check available balance for this job
    const availableBalance = await getLedgerAccountBalance(
      jobId,
      user.id,
      LedgerAccountType.TECHNICIAN_PAYABLE
    );

    if (withdrawalAmount > availableBalance) {
      return NextResponse.json(
        {
          error: "Insufficient balance",
          availableBalance,
          requestedAmount: withdrawalAmount,
        },
        { status: 400 }
      );
    }

    // Check if warranty hold is released (if there's a warranty hold for this job)
    const activeWarrantyHold = job.warrantyHolds.find(
      (hold) => hold.status === "LOCKED" || hold.status === "FROZEN"
    );

    if (activeWarrantyHold) {
      return NextResponse.json(
        {
          error: "Cannot withdraw while warranty hold is active",
          warrantyHoldStatus: activeWarrantyHold.status,
        },
        { status: 400 }
      );
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        technicianId: user.technicianProfile.id,
        jobId,
        amount: withdrawalAmount,
        bankAccountNumber: bankAccountNumber.trim(),
        bankIFSC: bankIFSC.trim().toUpperCase(),
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
        status: "PENDING",
      },
    });

    // Create audit log
    await createAuditLog({
      jobId,
      userId: user.id,
      userRole: "TECHNICIAN",
      action: AuditLogAction.WITHDRAWAL_CREATED,
      description: `Withdrawal request created: ₹${withdrawalAmount} for job ${job.jobNumber}`,
      amount: withdrawalAmount,
      withdrawalId: withdrawal.id,
      metadata: {
        bankName,
        accountHolderName,
      },
    });

    return NextResponse.json({
      success: true,
      withdrawal,
      message: "Withdrawal request created successfully",
    });
  } catch (error: any) {
    console.error("Error creating withdrawal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create withdrawal request" },
      { status: 500 }
    );
  }
}

/**
 * Get withdrawals (for technician or admin)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { technicianProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const where: any = {};

    if (user.role === "TECHNICIAN" && user.technicianProfile) {
      where.technicianId = user.technicianProfile.id;
    } else if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (status) {
      where.status = status;
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ withdrawals });
  } catch (error: any) {
    console.error("Error fetching withdrawals:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}

