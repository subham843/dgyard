/**
 * Warranty Hold Service
 * 
 * Manages warranty hold lifecycle:
 * - Creation (locked)
 * - Freeze (on complaint)
 * - Release (after warranty period)
 * - Forfeit (if issues not resolved)
 */

import { prisma } from "@/lib/prisma";
import { WarrantyHoldStatus, AuditLogAction, LedgerAccountType, LedgerEntryCategory } from "@prisma/client";
import { createAuditLog } from "./audit-log";
import { createDoubleEntry } from "./ledger";
import { sendNotification } from "@/lib/notifications";

export interface CreateWarrantyHoldParams {
  jobId: string;
  technicianId: string;
  dealerId: string;
  holdAmount: number;
  holdPercentage: number;
  warrantyDays: number;
  paymentId?: string;
  createdBy?: string;
}

export interface FreezeWarrantyHoldParams {
  warrantyHoldId: string;
  reason: string;
  frozenBy: string;
  userRole?: string;
}

export interface ReleaseWarrantyHoldParams {
  warrantyHoldId: string;
  reason: string;
  releasedBy: string;
  userRole?: string;
}

export interface ForfeitWarrantyHoldParams {
  warrantyHoldId: string;
  reason: string;
  forfeitedBy: string;
  userRole?: string;
}

/**
 * Create warranty hold
 */
export async function createWarrantyHold(params: CreateWarrantyHoldParams) {
  const {
    jobId,
    technicianId,
    dealerId,
    holdAmount,
    holdPercentage,
    warrantyDays,
    paymentId,
    createdBy,
  } = params;

  // Input validation
  if (!jobId || !technicianId || !dealerId) {
    throw new Error("Missing required parameters: jobId, technicianId, dealerId");
  }
  if (holdAmount <= 0) {
    throw new Error("Hold amount must be greater than 0");
  }
  if (warrantyDays < 0) {
    throw new Error("Warranty days must be non-negative");
  }

  // Check if warranty hold already exists for this job
  const existing = await prisma.warrantyHold.findFirst({
    where: {
      jobId,
      status: { in: ["LOCKED", "FROZEN"] },
    },
  });

  if (existing) {
    throw new Error("Active warranty hold already exists for this job");
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + warrantyDays);

  const warrantyHold = await prisma.warrantyHold.create({
    data: {
      jobId,
      technicianId,
      dealerId,
      holdAmount,
      holdPercentage,
      warrantyDays,
      startDate: now,
      endDate,
      effectiveEndDate: endDate, // Initially same as endDate, will adjust if paused
      status: WarrantyHoldStatus.LOCKED,
      isFrozen: false,
      pausedDuration: 0,
    },
  });

  // Create audit log
  await createAuditLog({
    jobId,
    userId: createdBy || undefined,
    userRole: createdBy ? "ADMIN" : "SYSTEM",
    action: AuditLogAction.WARRANTY_HOLD_CREATED,
    description: `Warranty hold created: ₹${holdAmount} for ${warrantyDays} days`,
    amount: holdAmount,
    warrantyHoldId: warrantyHold.id,
    metadata: {
      holdPercentage,
      warrantyDays,
      endDate: warrantyHold.endDate.toISOString(),
    },
  });

  return warrantyHold;
}

/**
 * Freeze warranty hold (e.g., when complaint is raised)
 */
export async function freezeWarrantyHold(params: FreezeWarrantyHoldParams) {
  const { warrantyHoldId, reason, frozenBy, userRole = "SYSTEM" } = params;

  const warrantyHold = await prisma.warrantyHold.findUnique({
    where: { id: warrantyHoldId },
    include: { job: true },
  });

  if (!warrantyHold) {
    throw new Error("Warranty hold not found");
  }

  if (warrantyHold.status !== WarrantyHoldStatus.LOCKED) {
    throw new Error(`Cannot freeze warranty hold with status: ${warrantyHold.status}`);
  }

  const now = new Date();
  let pausedDuration = warrantyHold.pausedDuration;

  // If not already paused, start pause timer
  if (!warrantyHold.isFrozen && !warrantyHold.lastPausedAt) {
    await prisma.warrantyHold.update({
      where: { id: warrantyHoldId },
      data: {
        status: WarrantyHoldStatus.FROZEN,
        isFrozen: true,
        frozenAt: now,
        freezeReason: reason,
        frozenBy,
        lastPausedAt: now,
      },
    });
  }

  // Create audit log
  await createAuditLog({
    jobId: warrantyHold.jobId,
    userId: frozenBy,
    userRole,
    action: AuditLogAction.WARRANTY_HOLD_FROZEN,
    description: `Warranty hold frozen: ${reason}`,
    amount: warrantyHold.holdAmount,
    warrantyHoldId,
    metadata: { reason },
  });

  return await prisma.warrantyHold.findUnique({
    where: { id: warrantyHoldId },
  });
}

/**
 * Unfreeze warranty hold (resume timer)
 */
export async function unfreezeWarrantyHold(warrantyHoldId: string, unfrozenBy: string, userRole: string = "SYSTEM") {
  const warrantyHold = await prisma.warrantyHold.findUnique({
    where: { id: warrantyHoldId },
  });

  if (!warrantyHold) {
    throw new Error("Warranty hold not found");
  }

  if (warrantyHold.status !== WarrantyHoldStatus.FROZEN || !warrantyHold.isFrozen) {
    throw new Error("Warranty hold is not frozen");
  }

  // Calculate paused duration
  const now = new Date();
  const lastPausedAt = warrantyHold.lastPausedAt || warrantyHold.frozenAt || now;
  const pauseDurationSeconds = Math.floor((now.getTime() - lastPausedAt.getTime()) / 1000);
  const totalPausedDuration = warrantyHold.pausedDuration + pauseDurationSeconds;

  // Extend effective end date by paused duration
  const effectiveEndDate = new Date(warrantyHold.endDate);
  effectiveEndDate.setSeconds(effectiveEndDate.getSeconds() + totalPausedDuration);

  const updated = await prisma.warrantyHold.update({
    where: { id: warrantyHoldId },
    data: {
      status: WarrantyHoldStatus.LOCKED,
      isFrozen: false,
      pausedDuration: totalPausedDuration,
      lastPausedAt: null,
      effectiveEndDate,
      updatedAt: now,
    },
  });

  return updated;
}

/**
 * Release warranty hold (after warranty period or admin approval)
 */
export async function releaseWarrantyHold(params: ReleaseWarrantyHoldParams) {
  const { warrantyHoldId, reason, releasedBy, userRole = "SYSTEM" } = params;

  const warrantyHold = await prisma.warrantyHold.findUnique({
    where: { id: warrantyHoldId },
    include: { job: true },
  });

  if (!warrantyHold) {
    throw new Error("Warranty hold not found");
  }

  if (warrantyHold.status === WarrantyHoldStatus.RELEASED) {
    throw new Error("Warranty hold already released");
  }

  if (warrantyHold.status === WarrantyHoldStatus.FORFEITED) {
    throw new Error("Cannot release forfeited warranty hold");
  }

  const now = new Date();

  const updated = await prisma.warrantyHold.update({
    where: { id: warrantyHoldId },
    data: {
      status: WarrantyHoldStatus.RELEASED,
      releasedAt: now,
      releasedBy,
      releaseReason: reason,
      isFrozen: false, // Ensure unfrozen
    },
  });

  // Move hold amount from WARRANTY_HOLD account to TECHNICIAN_PAYABLE via ledger
  try {
    const technician = await prisma.technician.findUnique({
      where: { id: warrantyHold.technicianId },
      include: { user: true },
    });

    if (technician?.user) {
      // Debit: WARRANTY_HOLD (system account - warranty hold is released)
      // Credit: TECHNICIAN_PAYABLE (technician will receive this)
      await createDoubleEntry({
        jobId: warrantyHold.jobId,
        debitAccount: {
          userId: undefined, // WARRANTY_HOLD is system account
          accountType: LedgerAccountType.WARRANTY_HOLD,
          amount: warrantyHold.holdAmount,
          category: LedgerEntryCategory.WARRANTY_HOLD,
          description: `Warranty hold released for job ${warrantyHold.job?.jobNumber || warrantyHold.jobId}`,
          warrantyHoldId,
        },
        creditAccount: {
          userId: technician.user.id,
          accountType: LedgerAccountType.TECHNICIAN_PAYABLE,
          amount: warrantyHold.holdAmount,
          category: LedgerEntryCategory.WARRANTY_HOLD,
          description: `Warranty hold released - amount available for withdrawal for job ${warrantyHold.job?.jobNumber || warrantyHold.jobId}`,
          warrantyHoldId,
        },
        createdBy: releasedBy !== "SYSTEM" ? releasedBy : undefined,
      });

      // Send notification to technician
      await sendNotification({
        userId: technician.user.id,
        jobId: warrantyHold.jobId,
        type: "WARRANTY_HOLD_RELEASED",
        title: "Warranty Period Completed",
        message: `Warranty period completed. ₹${warrantyHold.holdAmount.toLocaleString('en-IN')} has been released to your wallet.`,
        channels: ["IN_APP", "EMAIL", "WHATSAPP"],
        metadata: {
          jobNumber: warrantyHold.job?.jobNumber,
          amount: warrantyHold.holdAmount,
          warrantyHoldId,
        },
      });
    }
  } catch (ledgerError) {
    console.error("Error processing ledger entries for warranty release:", ledgerError);
    // Log error but don't fail the release - ledger can be fixed manually if needed
  }

  // Create audit log
  await createAuditLog({
    jobId: warrantyHold.jobId,
    userId: releasedBy !== "SYSTEM" ? releasedBy : undefined,
    userRole,
    action: AuditLogAction.WARRANTY_HOLD_RELEASED,
    description: `Warranty hold released: ${reason}`,
    amount: warrantyHold.holdAmount,
    warrantyHoldId,
    metadata: { reason },
  });

  return updated;
}

/**
 * Forfeit warranty hold (to dealer/refund)
 */
export async function forfeitWarrantyHold(params: ForfeitWarrantyHoldParams) {
  const { warrantyHoldId, reason, forfeitedBy, userRole = "SYSTEM" } = params;

  const warrantyHold = await prisma.warrantyHold.findUnique({
    where: { id: warrantyHoldId },
    include: { job: true },
  });

  if (!warrantyHold) {
    throw new Error("Warranty hold not found");
  }

  if (warrantyHold.status === WarrantyHoldStatus.RELEASED) {
    throw new Error("Cannot forfeit released warranty hold");
  }

  if (warrantyHold.status === WarrantyHoldStatus.FORFEITED) {
    throw new Error("Warranty hold already forfeited");
  }

  const now = new Date();

  const updated = await prisma.warrantyHold.update({
    where: { id: warrantyHoldId },
    data: {
      status: WarrantyHoldStatus.FORFEITED,
      forfeitedAt: now,
      forfeitedBy,
      forfeitReason: reason,
      isFrozen: false,
    },
  });

  // TODO: Handle forfeit - refund to dealer or keep in platform
  // This will be done via ledger service

  // Create audit log
  await createAuditLog({
    jobId: warrantyHold.jobId,
    userId: forfeitedBy,
    userRole,
    action: AuditLogAction.WARRANTY_HOLD_FORFEITED,
    description: `Warranty hold forfeited: ${reason}`,
    amount: warrantyHold.holdAmount,
    warrantyHoldId,
    metadata: { reason },
  });

  return updated;
}

/**
 * Get warranty hold details
 */
export async function getWarrantyHold(warrantyHoldId: string) {
  return await prisma.warrantyHold.findUnique({
    where: { id: warrantyHoldId },
    include: {
      job: {
        select: {
          id: true,
          jobNumber: true,
          title: true,
        },
      },
    },
  });
}

/**
 * Get warranty holds for a technician
 */
export async function getTechnicianWarrantyHolds(technicianId: string) {
  return await prisma.warrantyHold.findMany({
    where: { technicianId },
    include: {
      job: {
        select: {
          id: true,
          jobNumber: true,
          title: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Check and auto-release expired warranty holds
 */
export async function autoReleaseExpiredWarrantyHolds() {
  const now = new Date();
  
  const expiredHolds = await prisma.warrantyHold.findMany({
    where: {
      status: WarrantyHoldStatus.LOCKED,
      effectiveEndDate: {
        lte: now,
      },
    },
  });

  const results = [];
  
  for (const hold of expiredHolds) {
    try {
      await releaseWarrantyHold({
        warrantyHoldId: hold.id,
        reason: "Warranty period completed - automatic release",
        releasedBy: "SYSTEM",
        userRole: "SYSTEM",
      });
      results.push({ holdId: hold.id, status: "released" });
    } catch (error: any) {
      results.push({ holdId: hold.id, status: "error", error: error.message });
    }
  }

  return results;
}

