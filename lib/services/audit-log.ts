/**
 * Audit Log Service
 * 
 * Creates immutable audit logs for all financial actions
 */

import { prisma } from "@/lib/prisma";
import { AuditLogAction } from "@prisma/client";

export interface CreateAuditLogParams {
  jobId?: string;
  userId?: string;
  userRole: string; // "ADMIN" | "SYSTEM" | "AI"
  action: AuditLogAction;
  description: string;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  amount?: number;
  paymentId?: string;
  warrantyHoldId?: string;
  withdrawalId?: string;
  ledgerEntryId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  const {
    jobId,
    userId,
    userRole,
    action,
    description,
    previousValue,
    newValue,
    amount,
    paymentId,
    warrantyHoldId,
    withdrawalId,
    ledgerEntryId,
    metadata,
    ipAddress,
    userAgent,
  } = params;

  const auditLog = await prisma.auditLog.create({
    data: {
      jobId: jobId || null,
      userId: userId || null,
      userRole,
      action,
      description,
      previousValue: previousValue || null,
      newValue: newValue || null,
      amount: amount || null,
      paymentId: paymentId || null,
      warrantyHoldId: warrantyHoldId || null,
      withdrawalId: withdrawalId || null,
      ledgerEntryId: ledgerEntryId || null,
      metadata: metadata || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  });

  return auditLog;
}

/**
 * Get audit logs for a job
 */
export async function getJobAuditLogs(jobId: string) {
  return await prisma.auditLog.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(userId: string) {
  return await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get audit logs by action type
 */
export async function getAuditLogsByAction(action: AuditLogAction, limit: number = 100) {
  return await prisma.auditLog.findMany({
    where: { action },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}





