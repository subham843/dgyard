/**
 * Payment Split Service
 * 
 * Handles automatic payment splitting for jobs:
 * - Immediate payment to technician (after commission)
 * - Warranty hold (locked amount)
 * - All amounts tracked via ledger
 */

import { prisma } from "@/lib/prisma";
import { LedgerAccountType, LedgerEntryCategory, JobType } from "@prisma/client";
import { createDoubleEntry } from "./ledger";
import { createWarrantyHold } from "./warranty-hold";
import { calculateServiceCommission, checkMinimumMargin } from "./commission-calculator";

export interface PaymentSplitParams {
  jobId: string;
  totalAmount: number;
  holdPercentage: number; // e.g., 20 for 20%
  warrantyDays: number;
  technicianId: string;
  dealerId: string;
  commissionRate?: number; // DEPRECATED: Use commission calculator instead. Kept for backward compatibility
  paymentMethod?: "ONLINE" | "CASH" | "BANK_TRANSFER" | "OTHER";
  cashProofUrl?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdBy?: string; // Admin ID if manual
  // New fields for commission calculation
  jobType?: JobType;
  city?: string;
  region?: string;
  useCommissionCalculator?: boolean; // If true, uses commission calculator instead of commissionRate
}

export interface PaymentSplitResult {
  paymentId: string;
  immediateAmount: number;
  warrantyHoldAmount: number;
  commissionAmount: number;
  netAmount: number;
  warrantyHoldId?: string;
}

/**
 * Calculate payment split
 */
export function calculatePaymentSplit(
  totalAmount: number,
  holdPercentage: number,
  commissionRate: number = 0
) {
  // Calculate warranty hold amount
  const warrantyHoldAmount = (totalAmount * holdPercentage) / 100;
  
  // Calculate immediate amount (before commission)
  const immediateAmount = totalAmount - warrantyHoldAmount;
  
  // Calculate commission
  const commissionAmount = commissionRate > 0 
    ? (immediateAmount * commissionRate) / 100 
    : 0;
  
  // Calculate net amount to technician (after commission)
  const netAmount = immediateAmount - commissionAmount;
  
  return {
    totalAmount,
    immediateAmount,
    warrantyHoldAmount,
    commissionAmount,
    netAmount,
    commissionRate,
    holdPercentage,
  };
}

/**
 * Create payment split and ledger entries
 */
export async function createPaymentSplit(params: PaymentSplitParams): Promise<PaymentSplitResult> {
  const {
    jobId,
    totalAmount,
    holdPercentage,
    warrantyDays,
    technicianId,
    dealerId,
    commissionRate = 5, // Default 5% commission
    paymentMethod = "ONLINE",
    cashProofUrl,
    razorpayOrderId,
    razorpayPaymentId,
    createdBy,
  } = params;

  // Input validation
  if (!jobId || !technicianId || !dealerId) {
    throw new Error("Missing required parameters: jobId, technicianId, dealerId");
  }
  if (totalAmount <= 0) {
    throw new Error("Total amount must be greater than 0");
  }
  if (holdPercentage < 0 || holdPercentage > 100) {
    throw new Error("Hold percentage must be between 0 and 100");
  }
  if (warrantyDays < 0) {
    throw new Error("Warranty days must be non-negative");
  }
  if (commissionRate < 0 || commissionRate > 100) {
    throw new Error("Commission rate must be between 0 and 100");
  }

  // Get job details first (needed for commission calculation)
  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    include: {
      technician: true,
      dealer: {
        select: {
          id: true,
          city: true,
          state: true,
        },
      },
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  // Calculate commission using commission calculator if enabled
  let calculatedCommission = null;
  let finalCommissionRate = commissionRate || 0;
  let finalCommissionAmount = 0;

  if (params.useCommissionCalculator !== false) {
    // Use commission calculator
    calculatedCommission = await calculateServiceCommission({
      jobId,
      totalAmount,
      jobType: params.jobType || (job.serviceType as JobType) || undefined,
      city: params.city || job.dealer?.city || undefined,
      region: params.region || job.dealer?.state || undefined,
      dealerId: dealerId,
    });

    finalCommissionRate = calculatedCommission.commissionType === "PERCENTAGE"
      ? calculatedCommission.commissionValue
      : 0; // For fixed, we'll use the amount directly
    finalCommissionAmount = calculatedCommission.commissionAmount;

    // Check minimum margin requirement
    const marginCheck = await checkMinimumMargin({
      commissionAmount: finalCommissionAmount,
      totalAmount,
      isService: true,
      isProduct: false,
    });

    if (marginCheck.autoReject) {
      throw new Error(
        `Payment rejected: Platform margin (₹${finalCommissionAmount}) is below minimum required (₹${marginCheck.minimumRequired})`
      );
    }

    if (marginCheck.requiresApproval) {
      // Log for admin review - in production, you might want to set a flag on the job
      console.warn(
        `Payment requires admin approval: Platform margin (₹${finalCommissionAmount}) is below minimum (₹${marginCheck.minimumRequired})`
      );
    }
  } else {
    // Use provided commissionRate (backward compatibility)
    finalCommissionRate = commissionRate || 0;
  }

  // Calculate split
  const split = calculatePaymentSplit(
    totalAmount,
    holdPercentage,
    params.useCommissionCalculator !== false && calculatedCommission
      ? 0 // Commission already calculated, pass 0 to avoid double calculation
      : finalCommissionRate
  );

  // Override commission amount if calculated
  if (calculatedCommission) {
    split.commissionAmount = finalCommissionAmount;
    split.netAmount = split.immediateAmount - finalCommissionAmount;
  }

  if (job.assignedTechnicianId !== technicianId) {
    throw new Error("Technician ID does not match assigned technician");
  }

  if (job.dealerId !== dealerId) {
    throw new Error("Dealer ID does not match job dealer");
  }

  // Get technician user ID
  const technician = await prisma.technician.findUnique({
    where: { id: technicianId },
    include: { user: true },
  });

  if (!technician || !technician.user) {
    throw new Error("Technician not found");
  }

  // Check if payment already exists (prevent duplicates)
  const existingPayment = await prisma.jobPayment.findFirst({
    where: { 
      jobId,
      paymentType: "SERVICE_PAYMENT",
    },
  });

  if (existingPayment) {
    throw new Error("Payment split already exists for this job");
  }

  // Create JobPayment record
  const jobPayment = await prisma.jobPayment.create({
    data: {
      jobId,
      dealerId,
      technicianId,
      totalAmount: split.totalAmount,
      immediateAmount: split.immediateAmount,
      warrantyHoldAmount: split.warrantyHoldAmount,
      amount: split.immediateAmount, // For backward compatibility
      holdPercentage,
      paymentType: "SERVICE_PAYMENT",
      paymentMethod: paymentMethod as any,
      status: "PENDING",
      commissionRate: calculatedCommission
        ? (calculatedCommission.commissionType === "PERCENTAGE" ? calculatedCommission.commissionValue : 0)
        : finalCommissionRate,
      commissionAmount: split.commissionAmount,
      netAmount: split.netAmount,
      isWarrantyHold: true,
      warrantyHoldDays: warrantyDays,
      isCashPayment: paymentMethod === "CASH",
      cashProofUrl: cashProofUrl || null,
      razorpayOrderId: razorpayOrderId || null,
      razorpayPaymentId: razorpayPaymentId || null,
      paidAt: new Date(),
    },
  });

  // Create warranty hold first (needed for ledger entries)
  const warrantyHold = await createWarrantyHold({
    jobId,
    technicianId,
    dealerId,
    holdAmount: split.warrantyHoldAmount,
    holdPercentage,
    warrantyDays,
    paymentId: jobPayment.id,
    createdBy,
  });

  // Create ledger entries using double-entry accounting
  // 1. Debit: Dealer Receivable (dealer owes the total amount)
  //    Credit: Warranty Hold (warranty hold account)
  await createDoubleEntry({
    jobId,
    debitAccount: {
      userId: dealerId,
      accountType: LedgerAccountType.DEALER_RECEIVABLE,
      amount: split.warrantyHoldAmount,
      category: LedgerEntryCategory.WARRANTY_HOLD,
      description: `Warranty hold created for job ${job.jobNumber} (${holdPercentage}%)`,
      paymentId: jobPayment.id,
      warrantyHoldId: warrantyHold.id,
    },
    creditAccount: {
      userId: undefined, // System account
      accountType: LedgerAccountType.WARRANTY_HOLD,
      amount: split.warrantyHoldAmount,
      category: LedgerEntryCategory.WARRANTY_HOLD,
      description: `Warranty hold for job ${job.jobNumber}`,
      paymentId: jobPayment.id,
      warrantyHoldId: warrantyHold.id,
    },
    createdBy,
  });

  // 2. Debit: Dealer Receivable (for immediate amount)
  //    Credit: Technician Payable (technician will receive this)
  await createDoubleEntry({
    jobId,
    debitAccount: {
      userId: dealerId,
      accountType: LedgerAccountType.DEALER_RECEIVABLE,
      amount: split.immediateAmount,
      category: LedgerEntryCategory.JOB_PAYMENT,
      description: `Payment split for job ${job.jobNumber} - immediate amount`,
      paymentId: jobPayment.id,
    },
    creditAccount: {
      userId: technician.user.id,
      accountType: LedgerAccountType.TECHNICIAN_PAYABLE,
      amount: split.immediateAmount,
      category: LedgerEntryCategory.JOB_PAYMENT,
      description: `Payment for job ${job.jobNumber}`,
      paymentId: jobPayment.id,
    },
    createdBy,
  });

  // 3. If commission > 0, deduct commission
  if (split.commissionAmount > 0) {
    // Debit: Technician Payable (reduce technician's payable)
    // Credit: Platform Commission (commission account)
    await createDoubleEntry({
      jobId,
      debitAccount: {
        userId: technician.user.id,
        accountType: LedgerAccountType.TECHNICIAN_PAYABLE,
        amount: split.commissionAmount,
        category: LedgerEntryCategory.COMMISSION,
        description: `Platform commission (${commissionRate}%) for job ${job.jobNumber}`,
        paymentId: jobPayment.id,
      },
      creditAccount: {
        userId: undefined, // Platform account
        accountType: LedgerAccountType.PLATFORM_COMMISSION,
        amount: split.commissionAmount,
        category: LedgerEntryCategory.COMMISSION,
        description: `Commission from job ${job.jobNumber}`,
        paymentId: jobPayment.id,
      },
      createdBy,
    });
  }

  // Update payment with warranty hold ID
  await prisma.jobPayment.update({
    where: { id: jobPayment.id },
    data: {
      warrantyHoldReleaseDate: warrantyHold.endDate,
    },
  });

  // Create audit log (async, non-blocking)
  createAuditLog({
      jobId,
      userId: createdBy || undefined,
      userRole: createdBy ? "ADMIN" : "SYSTEM",
      action: AuditLogAction.PAYMENT_SPLIT,
      description: `Payment split created for job ${job.jobNumber}: Immediate ₹${split.netAmount}, Hold ₹${split.warrantyHoldAmount}, Commission ₹${split.commissionAmount}`,
      amount: totalAmount,
      paymentId: jobPayment.id,
      metadata: {
        split,
        warrantyDays,
        holdPercentage,
        commissionRate,
      },
    }).catch((err) => {
      console.error("Error creating audit log:", err);
      // Don't throw - audit log failure shouldn't fail the payment split
    });

  return {
    paymentId: jobPayment.id,
    immediateAmount: split.immediateAmount,
    warrantyHoldAmount: split.warrantyHoldAmount,
    commissionAmount: split.commissionAmount,
    netAmount: split.netAmount,
    warrantyHoldId: warrantyHold.id,
  };
}

/**
 * Release payment from escrow and split it
 * 80% goes to technician immediately, 20% held for warranty
 */
export async function releasePaymentFromEscrow(params: {
  jobId: string;
  totalAmount: number;
  holdPercentage: number;
  warrantyDays: number;
  technicianId: string;
  dealerId: string;
  commissionRate: number;
  createdBy?: string;
}): Promise<PaymentSplitResult> {
  const {
    jobId,
    totalAmount,
    holdPercentage,
    warrantyDays,
    technicianId,
    dealerId,
    commissionRate,
    createdBy,
  } = params;

  // Calculate split: 80% immediate, 20% warranty hold
  const split = calculatePaymentSplit(totalAmount, holdPercentage, commissionRate);

  // Get job and technician details
  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    include: {
      technician: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!job || !job.technician || !job.technician.user) {
    throw new Error("Job or technician not found");
  }

  // Check if payment already exists (from technician completion)
  let jobPayment = await prisma.jobPayment.findFirst({
    where: { 
      jobId,
      paymentType: "SERVICE_PAYMENT",
    },
  });

  if (jobPayment) {
    // Update existing payment instead of creating new one
    jobPayment = await prisma.jobPayment.update({
      where: { id: jobPayment.id },
      data: {
        totalAmount: split.totalAmount,
        immediateAmount: split.immediateAmount,
        warrantyHoldAmount: split.warrantyHoldAmount,
        amount: split.immediateAmount,
        holdPercentage,
        commissionRate,
        commissionAmount: split.commissionAmount,
        netAmount: split.netAmount,
        isWarrantyHold: true,
        warrantyHoldDays: warrantyDays,
        paidAt: jobPayment.paidAt || new Date(),
      },
    });
  } else {
    // Create new JobPayment record
    jobPayment = await prisma.jobPayment.create({
      data: {
        jobId,
        dealerId,
        technicianId,
        totalAmount: split.totalAmount,
        immediateAmount: split.immediateAmount,
        warrantyHoldAmount: split.warrantyHoldAmount,
        amount: split.immediateAmount,
        holdPercentage,
        paymentType: "SERVICE_PAYMENT",
        paymentMethod: "ONLINE",
        status: "ESCROW_HOLD",
        commissionRate,
        commissionAmount: split.commissionAmount,
        netAmount: split.netAmount,
        isWarrantyHold: true,
        warrantyHoldDays: warrantyDays,
        paidAt: new Date(),
      },
    });
  }

  // Create warranty hold
  const warrantyHold = await createWarrantyHold({
    jobId,
    technicianId,
    dealerId,
    holdAmount: split.warrantyHoldAmount,
    holdPercentage,
    warrantyDays,
    paymentId: jobPayment.id,
    createdBy,
  });

  // Release from ESCROW to TECHNICIAN_PAYABLE (80% immediate)
  await createDoubleEntry({
    jobId,
    debitAccount: {
      userId: undefined, // ESCROW is system account
      accountType: LedgerAccountType.ESCROW,
      amount: split.immediateAmount,
      category: LedgerEntryCategory.JOB_PAYMENT,
      description: `Release from escrow for job ${job.jobNumber} - immediate payment (80%)`,
      paymentId: jobPayment.id,
    },
    creditAccount: {
      userId: job.technician.user.id,
      accountType: LedgerAccountType.TECHNICIAN_PAYABLE,
      amount: split.immediateAmount,
      category: LedgerEntryCategory.JOB_PAYMENT,
      description: `Payment released from escrow for job ${job.jobNumber}`,
      paymentId: jobPayment.id,
    },
    createdBy,
  });

  // Release from ESCROW to WARRANTY_HOLD (20% hold)
  await createDoubleEntry({
    jobId,
    debitAccount: {
      userId: undefined, // ESCROW is system account
      accountType: LedgerAccountType.ESCROW,
      amount: split.warrantyHoldAmount,
      category: LedgerEntryCategory.WARRANTY_HOLD,
      description: `Release from escrow for job ${job.jobNumber} - warranty hold (20%)`,
      paymentId: jobPayment.id,
      warrantyHoldId: warrantyHold.id,
    },
    creditAccount: {
      userId: undefined, // WARRANTY_HOLD is system account
      accountType: LedgerAccountType.WARRANTY_HOLD,
      amount: split.warrantyHoldAmount,
      category: LedgerEntryCategory.WARRANTY_HOLD,
      description: `Warranty hold for job ${job.jobNumber} (10 days)`,
      paymentId: jobPayment.id,
      warrantyHoldId: warrantyHold.id,
    },
    createdBy,
  });

  // If commission > 0, deduct from technician payable
  if (split.commissionAmount > 0) {
    await createDoubleEntry({
      jobId,
      debitAccount: {
        userId: job.technician.user.id,
        accountType: LedgerAccountType.TECHNICIAN_PAYABLE,
        amount: split.commissionAmount,
        category: LedgerEntryCategory.JOB_PAYMENT,
        description: `Commission deduction for job ${job.jobNumber}`,
        paymentId: jobPayment.id,
      },
      creditAccount: {
        userId: undefined, // Platform commission account
        accountType: LedgerAccountType.PLATFORM_COMMISSION,
        amount: split.commissionAmount,
        category: LedgerEntryCategory.JOB_PAYMENT,
        description: `Platform commission for job ${job.jobNumber}`,
        paymentId: jobPayment.id,
      },
      createdBy,
    });
  }

  // Update payment status to RELEASED (80% released, 20% in warranty hold)
  const updatedPayment = await prisma.jobPayment.update({
    where: { id: jobPayment.id },
    data: {
      status: "RELEASED",
      releasedAt: new Date(),
    },
  });

  // Log payment release for debugging
  console.log(`Payment released from escrow for job ${job.jobNumber}:`, {
    paymentId: updatedPayment.id,
    immediateAmount: split.immediateAmount,
    netAmount: split.netAmount,
    commissionAmount: split.commissionAmount,
    warrantyHoldAmount: split.warrantyHoldAmount,
    technicianId: job.technician.id,
    technicianUserId: job.technician.user.id,
  });

  return {
    paymentId: updatedPayment.id,
    immediateAmount: split.immediateAmount,
    warrantyHoldAmount: split.warrantyHoldAmount,
    commissionAmount: split.commissionAmount,
    netAmount: split.netAmount,
    warrantyHoldId: warrantyHold.id,
  };
}

/**
 * Get payment split details for a job
 */
export async function getPaymentSplit(jobId: string) {
  const payment = await prisma.jobPayment.findFirst({
    where: { jobId },
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

  if (!payment) {
    return null;
  }

  const split = calculatePaymentSplit(
    payment.totalAmount,
    payment.holdPercentage,
    payment.commissionRate || 0
  );

  return {
    ...payment,
    split,
  };
}

