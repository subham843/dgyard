/**
 * Payment Flow Service
 * 
 * Handles the complete payment flow execution order:
 * 1. onPaymentInitiated - Fetch job/order and commission rules
 * 2. calculatePlatformFee - Calculate platform commission
 * 3. createPlatformLedgerEntry - Create ledger entry for platform fee
 * 4. splitServiceAmount - Split service amount (for service jobs only)
 * 5. lockWarrantyHold - Lock warranty hold amount
 */

import { prisma } from "@/lib/prisma";
import { LedgerAccountType, LedgerEntryCategory } from "@prisma/client";
import { calculateServiceCommission, calculateProductCommission, checkMinimumMargin } from "./commission-calculator";
import { createDoubleEntry } from "./ledger";
import { createWarrantyHold } from "./warranty-hold";

export interface PaymentInitiatedParams {
  jobId?: string;
  orderId?: string;
  paymentMethod?: "ONLINE" | "CASH" | "BANK_TRANSFER" | "OTHER";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  cashProofUrl?: string;
}

export interface PaymentInitiatedResult {
  totalAmount: number;
  commissionCalculation: any;
  job?: any;
  order?: any;
}

/**
 * Step 1: onPaymentInitiated
 * Fetch job/order amount and applicable commission rules
 */
export async function onPaymentInitiated(
  params: PaymentInitiatedParams
): Promise<PaymentInitiatedResult> {
  const { jobId, orderId } = params;

  if (!jobId && !orderId) {
    throw new Error("Either jobId or orderId is required");
  }

  if (jobId) {
    // Service job payment
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        technician: {
          include: {
            user: true,
          },
        },
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

    const totalAmount = job.finalPrice || job.estimatedPrice || 0;

    // Calculate commission
    const commissionCalculation = await calculateServiceCommission({
      jobId,
      totalAmount,
      jobType: job.serviceType as any,
      city: job.dealer?.city || undefined,
      region: job.dealer?.state || undefined,
      dealerId: job.dealerId,
    });

    return {
      totalAmount,
      commissionCalculation,
      job,
    };
  } else {
    // Product order payment
    const order = await prisma.order.findUnique({
      where: { id: orderId! },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        address: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const totalAmount = order.total;
    const isCOD = order.paymentMethod === "COD";
    const categoryId = order.items[0]?.product?.categoryId;

    // Calculate commission
    const commissionCalculation = await calculateProductCommission({
      orderId: orderId!,
      totalAmount,
      categoryId: categoryId || undefined,
      isCOD,
      isReturn: false,
    });

    return {
      totalAmount,
      commissionCalculation,
      order,
    };
  }
}

/**
 * Step 2: calculatePlatformFee
 * Calculate platform fee based on commission rules
 */
export async function calculatePlatformFee(params: {
  totalAmount: number;
  commissionType: "PERCENTAGE" | "FIXED";
  commissionValue: number;
}): Promise<{
  platformFee: number;
  netServiceAmount: number;
}> {
  const { totalAmount, commissionType, commissionValue } = params;

  let platformFee = 0;

  if (commissionType === "PERCENTAGE") {
    platformFee = (totalAmount * commissionValue) / 100;
  } else {
    // FIXED
    platformFee = commissionValue;
  }

  const netServiceAmount = totalAmount - platformFee;

  return {
    platformFee,
    netServiceAmount,
  };
}

/**
 * Step 3: createPlatformLedgerEntry
 * Create ledger entry for platform commission
 */
export async function createPlatformLedgerEntry(params: {
  jobId?: string;
  orderId?: string;
  platformFee: number;
  description: string;
  createdBy?: string;
}): Promise<string> {
  const { jobId, orderId, platformFee, description, createdBy } = params;

  if (!jobId && !orderId) {
    throw new Error("Either jobId or orderId is required");
  }

  // Get the source account (dealer receivable for jobs, order for products)
  let debitAccount: any = null;

  if (jobId) {
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      select: { dealerId: true },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    debitAccount = {
      userId: job.dealerId,
      accountType: LedgerAccountType.DEALER_RECEIVABLE,
      amount: platformFee,
      category: LedgerEntryCategory.COMMISSION,
      description,
      jobId,
    };
  } else {
    const order = await prisma.order.findUnique({
      where: { id: orderId! },
      select: { userId: true },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // For products, commission is deducted from seller/dealer
    // This might need adjustment based on your product commission model
    debitAccount = {
      userId: order.userId, // Customer - commission might be added to order total
      accountType: LedgerAccountType.DEALER_RECEIVABLE, // Adjust based on your model
      amount: platformFee,
      category: LedgerEntryCategory.COMMISSION,
      description,
    };
  }

  // Credit: Platform Commission
  const creditAccount = {
    userId: undefined, // Platform account
    accountType: LedgerAccountType.PLATFORM_COMMISSION,
    amount: platformFee,
    category: LedgerEntryCategory.COMMISSION,
    description,
    jobId,
  };

  await createDoubleEntry({
    jobId,
    debitAccount,
    creditAccount,
    createdBy,
  });

  // Return a reference ID (in a real implementation, you'd return the ledger entry ID)
  return `ledger-entry-${Date.now()}`;
}

/**
 * Step 4: splitServiceAmount
 * Split service amount into immediate pay and warranty hold
 * (Only for service jobs)
 */
export async function splitServiceAmount(params: {
  jobId: string;
  netServiceAmount: number;
  holdPercentage: number;
  technicianId: string;
  dealerId: string;
}): Promise<{
  technicianImmediatePay: number;
  technicianWarrantyHold: number;
}> {
  const { jobId, netServiceAmount, holdPercentage, technicianId, dealerId } = params;

  // Calculate warranty hold amount
  const technicianWarrantyHold = (netServiceAmount * holdPercentage) / 100;
  const technicianImmediatePay = netServiceAmount - technicianWarrantyHold;

  return {
    technicianImmediatePay,
    technicianWarrantyHold,
  };
}

/**
 * Step 5: lockWarrantyHold
 * Lock warranty hold amount and start warranty timer
 */
export async function lockWarrantyHold(params: {
  jobId: string;
  technicianId: string;
  dealerId: string;
  holdAmount: number;
  holdPercentage: number;
  warrantyDays: number;
  paymentId: string;
  createdBy?: string;
}): Promise<string> {
  const { jobId, technicianId, dealerId, holdAmount, holdPercentage, warrantyDays, paymentId, createdBy } = params;

  const warrantyHold = await createWarrantyHold({
    jobId,
    technicianId,
    dealerId,
    holdAmount,
    holdPercentage,
    warrantyDays,
    paymentId,
    createdBy,
  });

  return warrantyHold.id;
}

/**
 * Complete payment flow for service jobs
 * Executes all steps in order
 */
export async function executeServicePaymentFlow(params: {
  jobId: string;
  holdPercentage: number;
  warrantyDays: number;
  paymentMethod?: "ONLINE" | "CASH" | "BANK_TRANSFER" | "OTHER";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  cashProofUrl?: string;
  createdBy?: string;
}): Promise<{
  paymentId: string;
  platformFee: number;
  technicianImmediatePay: number;
  technicianWarrantyHold: number;
  warrantyHoldId: string;
}> {
  const { jobId, holdPercentage, warrantyDays, paymentMethod, razorpayOrderId, razorpayPaymentId, cashProofUrl, createdBy } = params;

  // Step 1: onPaymentInitiated
  const { totalAmount, commissionCalculation, job } = await onPaymentInitiated({
    jobId,
    paymentMethod,
    razorpayOrderId,
    razorpayPaymentId,
    cashProofUrl,
  });

  if (!job) {
    throw new Error("Job not found");
  }

  // Step 2: calculatePlatformFee
  const { platformFee, netServiceAmount } = await calculatePlatformFee({
    totalAmount,
    commissionType: commissionCalculation.commissionType,
    commissionValue: commissionCalculation.commissionValue,
  });

  // Check minimum margin
  const marginCheck = await checkMinimumMargin({
    commissionAmount: platformFee,
    totalAmount,
    isService: true,
    isProduct: false,
  });

  if (marginCheck.autoReject) {
    throw new Error(
      `Payment rejected: Platform margin (₹${platformFee}) is below minimum required (₹${marginCheck.minimumRequired})`
    );
  }

  // Step 3: createPlatformLedgerEntry
  await createPlatformLedgerEntry({
    jobId,
    platformFee,
    description: `Platform commission for job ${job.jobNumber}`,
    createdBy,
  });

  // Step 4: splitServiceAmount
  const { technicianImmediatePay, technicianWarrantyHold } = await splitServiceAmount({
    jobId,
    netServiceAmount,
    holdPercentage,
    technicianId: job.assignedTechnicianId!,
    dealerId: job.dealerId,
  });

  // Create JobPayment record
  const jobPayment = await prisma.jobPayment.create({
    data: {
      jobId,
      dealerId: job.dealerId,
      technicianId: job.assignedTechnicianId!,
      totalAmount,
      immediateAmount: technicianImmediatePay,
      warrantyHoldAmount: technicianWarrantyHold,
      amount: technicianImmediatePay,
      holdPercentage,
      paymentType: "SERVICE_PAYMENT",
      paymentMethod: (paymentMethod || "ONLINE") as any,
      status: "PENDING",
      commissionRate: commissionCalculation.commissionType === "PERCENTAGE" ? commissionCalculation.commissionValue : 0,
      commissionAmount: platformFee,
      netAmount: technicianImmediatePay,
      isWarrantyHold: true,
      warrantyHoldDays: warrantyDays,
      isCashPayment: paymentMethod === "CASH",
      cashProofUrl: cashProofUrl || null,
      razorpayOrderId: razorpayOrderId || null,
      razorpayPaymentId: razorpayPaymentId || null,
      paidAt: new Date(),
    },
  });

  // Step 5: lockWarrantyHold
  const warrantyHoldId = await lockWarrantyHold({
    jobId,
    technicianId: job.assignedTechnicianId!,
    dealerId: job.dealerId,
    holdAmount: technicianWarrantyHold,
    holdPercentage,
    warrantyDays,
    paymentId: jobPayment.id,
    createdBy,
  });

  // Create ledger entries for technician payment
  await createDoubleEntry({
    jobId,
    debitAccount: {
      userId: job.dealerId,
      accountType: LedgerAccountType.DEALER_RECEIVABLE,
      amount: technicianImmediatePay,
      category: LedgerEntryCategory.JOB_PAYMENT,
      description: `Payment for job ${job.jobNumber} - immediate amount`,
      paymentId: jobPayment.id,
    },
    creditAccount: {
      userId: job.technician?.user.id,
      accountType: LedgerAccountType.TECHNICIAN_PAYABLE,
      amount: technicianImmediatePay,
      category: LedgerEntryCategory.JOB_PAYMENT,
      description: `Payment for job ${job.jobNumber}`,
      paymentId: jobPayment.id,
    },
    createdBy,
  });

  return {
    paymentId: jobPayment.id,
    platformFee,
    technicianImmediatePay,
    technicianWarrantyHold,
    warrantyHoldId,
  };
}

