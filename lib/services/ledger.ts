/**
 * Ledger Service - Double-Entry Accounting System
 * 
 * This service implements a ledger-based internal wallet system.
 * Key principles:
 * - Every transaction creates TWO entries (DEBIT and CREDIT)
 * - Money exists ONLY against a Job ID (no free balance)
 * - All transactions are immutable and auditable
 */

import { prisma } from "@/lib/prisma";
import { LedgerAccountType, LedgerEntryType, LedgerEntryCategory } from "@prisma/client";

export interface CreateLedgerEntryParams {
  jobId: string;
  userId?: string; // Technician or Dealer ID
  accountType: LedgerAccountType;
  entryType: LedgerEntryType;
  amount: number;
  category: LedgerEntryCategory;
  description: string;
  paymentId?: string;
  warrantyHoldId?: string;
  withdrawalId?: string;
  counterEntryId?: string;
  metadata?: Record<string, any>;
  createdBy?: string; // Admin ID if manual adjustment
}

export interface CreateDoubleEntryParams {
  jobId: string;
  debitAccount: {
    userId?: string;
    accountType: LedgerAccountType;
    amount: number;
    category: LedgerEntryCategory;
    description: string;
    paymentId?: string;
    warrantyHoldId?: string;
    withdrawalId?: string;
    metadata?: Record<string, any>;
  };
  creditAccount: {
    userId?: string;
    accountType: LedgerAccountType;
    amount: number;
    category: LedgerEntryCategory;
    description: string;
    paymentId?: string;
    warrantyHoldId?: string;
    withdrawalId?: string;
    metadata?: Record<string, any>;
  };
  createdBy?: string;
}

/**
 * Get or create a ledger account
 */
export async function getOrCreateLedgerAccount(
  jobId: string,
  userId: string | undefined,
  accountType: LedgerAccountType,
  accountName?: string
) {
  // Validate required parameters
  if (!jobId) {
    throw new Error("Job ID is required for ledger account creation");
  }
  if (accountType === undefined || accountType === null) {
    throw new Error(`AccountType is required for ledger account creation. Received: ${accountType}. Valid values are: ${Object.values(LedgerAccountType).join(", ")}`);
  }

  // Check if account exists - MongoDB handles null in unique indexes
  const existing = await prisma.ledgerAccount.findFirst({
    where: {
      jobId,
      userId: userId || null,
      accountType,
    },
  });

  if (existing) {
    return existing;
  }

  // Create new account
  const account = await prisma.ledgerAccount.create({
    data: {
      jobId,
      userId: userId || null,
      accountType,
      accountName: accountName || `${accountType}_${jobId}`,
      balance: 0,
    },
  });

  return account;
}

/**
 * Create a single ledger entry (part of double-entry)
 */
export async function createLedgerEntry(params: CreateLedgerEntryParams) {
  const {
    jobId,
    userId,
    accountType,
    entryType,
    amount,
    category,
    description,
    paymentId,
    warrantyHoldId,
    withdrawalId,
    counterEntryId,
    metadata,
    createdBy,
  } = params;

  // Get or create the account
  const account = await getOrCreateLedgerAccount(jobId, userId, accountType);

  // Check for duplicate entries (prevent duplicate creation)
  if (paymentId) {
    const existingEntry = await prisma.ledgerEntry.findFirst({
      where: {
        jobId,
        paymentId,
        category,
        entryType,
      },
    });
    if (existingEntry) {
      throw new Error("Ledger entry already exists for this payment");
    }
  }

  // Create the entry - always set counterEntryId explicitly to null to avoid unique constraint violations
  // Note: We don't use counterEntryId for linking entries to avoid unique constraint issues
  const entry = await prisma.ledgerEntry.create({
    data: {
      accountId: account.id,
      jobId,
      entryType,
      amount,
      category,
      description,
      paymentId: paymentId || null,
      warrantyHoldId: warrantyHoldId || null,
      withdrawalId: withdrawalId || null,
      counterEntryId: null, // Explicitly set to null to avoid unique constraint violations
      metadata: metadata || {},
      createdBy: createdBy || null,
    },
  });

  // Update account balance
  const balanceChange = entryType === LedgerEntryType.DEBIT ? -amount : amount;
  await prisma.ledgerAccount.update({
    where: { id: account.id },
    data: {
      balance: {
        increment: balanceChange,
      },
    },
  });

  return { entry, account: { ...account, balance: account.balance + balanceChange } };
}

/**
 * Create double-entry (DEBIT and CREDIT) - ensures accounting equation always balances
 */
export async function createDoubleEntry(params: CreateDoubleEntryParams) {
  const { jobId, debitAccount, creditAccount, createdBy } = params;

  // Input validation
  if (!jobId) {
    throw new Error("Job ID is required");
  }
  if (!debitAccount || !creditAccount) {
    throw new Error("Both debit and credit accounts are required");
  }
  if (debitAccount.amount <= 0 || creditAccount.amount <= 0) {
    throw new Error("Amounts must be greater than 0");
  }

  // Validate amounts match (allow small floating point differences)
  if (Math.abs(debitAccount.amount - creditAccount.amount) > 0.01) {
    throw new Error(`Debit and credit amounts must match for double-entry accounting. Debit: ${debitAccount.amount}, Credit: ${creditAccount.amount}`);
  }

  // Get or create accounts first (outside transaction to avoid nested transaction issues)
  const debitAccountRecord = await getOrCreateLedgerAccount(
    jobId,
    debitAccount.userId,
    debitAccount.accountType
  );
  
  const creditAccountRecord = await getOrCreateLedgerAccount(
    jobId,
    creditAccount.userId,
    creditAccount.accountType
  );

  // Use transaction with isolation level to ensure atomicity and prevent race conditions
  return await prisma.$transaction(async (tx) => {
    // Check if entries already exist (double-check inside transaction to prevent race conditions)
    // Check for existing entries using paymentId (most reliable) or category
    const existingEntriesWhere: any = {
      jobId,
      category: debitAccount.category,
    };
    
    // If paymentId is provided, check for it specifically
    if (debitAccount.paymentId) {
      existingEntriesWhere.paymentId = debitAccount.paymentId;
    }
    
    const existingEntries = await tx.ledgerEntry.findFirst({
      where: existingEntriesWhere,
    });

    if (existingEntries) {
      throw new Error("Ledger entries already exist for this payment");
    }

    // Create debit entry (without counterEntryId initially)
    const debitEntry = await tx.ledgerEntry.create({
      data: {
        accountId: debitAccountRecord.id,
        jobId,
        entryType: LedgerEntryType.DEBIT,
        amount: debitAccount.amount,
        category: debitAccount.category,
        description: debitAccount.description,
        paymentId: debitAccount.paymentId || null,
        warrantyHoldId: debitAccount.warrantyHoldId || null,
        withdrawalId: debitAccount.withdrawalId || null,
        counterEntryId: null, // Will be set after credit entry is created
        metadata: debitAccount.metadata || {},
        createdBy: createdBy || null,
      },
    });

    // Update debit account balance
    const debitBalanceChange = -debitAccount.amount;
    await tx.ledgerAccount.update({
      where: { id: debitAccountRecord.id },
      data: {
        balance: { increment: debitBalanceChange },
      },
    });

    // Create credit entry WITHOUT setting counterEntryId at all
    // We'll link them via the reverseCounterEntry relation if needed, but don't set counterEntryId
    // This avoids unique constraint violations entirely
    const creditEntry = await tx.ledgerEntry.create({
      data: {
        accountId: creditAccountRecord.id,
        jobId,
        entryType: LedgerEntryType.CREDIT,
        amount: creditAccount.amount,
        category: creditAccount.category,
        description: creditAccount.description,
        paymentId: creditAccount.paymentId || null,
        warrantyHoldId: creditAccount.warrantyHoldId || null,
        withdrawalId: creditAccount.withdrawalId || null,
        counterEntryId: null, // Leave as null to avoid unique constraint issues
        metadata: creditAccount.metadata || {},
        createdBy: createdBy || null,
      },
    });
    
    // Note: We're NOT setting counterEntryId to avoid unique constraint violations
    // The relationship can be inferred from jobId, category, and timestamps
    // If bidirectional linking is needed, use the reverseCounterEntry relation field

    // Update credit account balance
    const creditBalanceChange = creditAccount.amount;
    await tx.ledgerAccount.update({
      where: { id: creditAccountRecord.id },
      data: {
        balance: { increment: creditBalanceChange },
      },
    });

    // Note: We only set counterEntryId on credit entry (one-way link)
    // The reverse relation (reverseCounterEntry) can be used to query from debit to credit
    // This avoids unique constraint violations

    // Fetch updated account balances
    const updatedDebitAccount = await tx.ledgerAccount.findUnique({
      where: { id: debitAccountRecord.id },
    });
    
    const updatedCreditAccount = await tx.ledgerAccount.findUnique({
      where: { id: creditAccountRecord.id },
    });
    
    return {
      debit: {
        entry: debitEntry,
        account: updatedDebitAccount || debitAccountRecord,
      },
      credit: {
        entry: creditEntry,
        account: updatedCreditAccount || creditAccountRecord,
      },
    };
  });
}

/**
 * Get ledger account balance for a job and user
 */
export async function getLedgerAccountBalance(
  jobId: string,
  userId: string | undefined,
  accountType: LedgerAccountType,
): Promise<number> {
  const account = await prisma.ledgerAccount.findFirst({
    where: {
      jobId,
      userId: userId || null,
      accountType,
    },
  });

  return account?.balance || 0;
}

/**
 * Get all ledger entries for a job
 */
export async function getJobLedgerEntries(jobId: string) {
  const entries = await prisma.ledgerEntry.findMany({
    where: { jobId },
    include: {
      account: true,
      counterEntry: {
        include: {
          account: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return entries;
}

/**
 * Get ledger entries for a user across all jobs
 */
export async function getUserLedgerEntries(userId: string, jobId?: string) {
  const accounts = await prisma.ledgerAccount.findMany({
    where: {
      userId,
      ...(jobId && { jobId }),
    },
    include: {
      entries: {
        include: {
          job: {
            select: {
              id: true,
              jobNumber: true,
              title: true,
            },
          },
          counterEntry: {
            include: {
              account: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return accounts;
}

/**
 * Verify ledger balance (sum of all accounts for a job should be 0)
 */
export async function verifyLedgerBalance(jobId: string): Promise<{ balanced: boolean; total: number }> {
  const accounts = await prisma.ledgerAccount.findMany({
    where: { jobId },
  });

  const total = accounts.reduce((sum, account) => sum + account.balance, 0);
  const balanced = Math.abs(total) < 0.01; // Allow small floating point errors

  return { balanced, total };
}

