/**
 * Job State Validator
 * 
 * Enforces state machine rules and prevents invalid state transitions
 */

import { JobStatus } from "@prisma/client";

// Valid state transitions
const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  PENDING: [
    "SOFT_LOCKED",
    "NEGOTIATION_PENDING",
    "WAITING_FOR_PAYMENT",
    "CANCELLED",
  ],
  SOFT_LOCKED: [
    "WAITING_FOR_PAYMENT",
    "PENDING", // If soft lock expires
    "CANCELLED",
  ],
  NEGOTIATION_PENDING: [
    "WAITING_FOR_PAYMENT",
    "PENDING", // If all bids rejected/expired
    "CANCELLED",
  ],
  WAITING_FOR_PAYMENT: [
    "ASSIGNED",
    "PENDING", // If payment deadline expires
    "CANCELLED",
  ],
  ASSIGNED: [
    "IN_PROGRESS",
    "CANCELLED",
  ],
  IN_PROGRESS: [
    "COMPLETION_PENDING_APPROVAL",
    "CANCELLED",
  ],
  COMPLETION_PENDING_APPROVAL: [
    "COMPLETED",
    "IN_PROGRESS", // If dealer rejects completion
    "CANCELLED",
  ],
  COMPLETED: [
    // Terminal state - no transitions allowed
  ],
  CANCELLED: [
    // Terminal state - no transitions allowed
  ],
};

/**
 * Validate state transition
 */
export function validateStateTransition(
  currentStatus: JobStatus,
  newStatus: JobStatus
): { valid: boolean; error?: string } {
  // Check if transition is allowed
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid state transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTransitions?.join(", ") || "none"}`,
    };
  }

  return { valid: true };
}

/**
 * Validate job state for specific operations
 */
export function validateJobStateForOperation(
  status: JobStatus,
  operation: "accept" | "bid" | "start" | "complete" | "approve" | "cancel" | "lock_payment"
): { valid: boolean; error?: string } {
  switch (operation) {
    case "accept":
      if (status !== "PENDING" && status !== "SOFT_LOCKED") {
        return {
          valid: false,
          error: `Cannot accept job in ${status} state. Job must be PENDING or SOFT_LOCKED.`,
        };
      }
      break;

    case "bid":
      if (status !== "PENDING" && status !== "NEGOTIATION_PENDING") {
        return {
          valid: false,
          error: `Cannot bid on job in ${status} state. Job must be PENDING or NEGOTIATION_PENDING.`,
        };
      }
      break;

    case "start":
      if (status !== "ASSIGNED") {
        return {
          valid: false,
          error: `Cannot start job in ${status} state. Job must be ASSIGNED.`,
        };
      }
      break;

    case "complete":
      if (status !== "IN_PROGRESS") {
        return {
          valid: false,
          error: `Cannot complete job in ${status} state. Job must be IN_PROGRESS.`,
        };
      }
      break;

    case "approve":
      if (status !== "COMPLETION_PENDING_APPROVAL") {
        return {
          valid: false,
          error: `Cannot approve job in ${status} state. Job must be COMPLETION_PENDING_APPROVAL.`,
        };
      }
      break;

    case "lock_payment":
      if (status !== "WAITING_FOR_PAYMENT") {
        return {
          valid: false,
          error: `Cannot lock payment for job in ${status} state. Job must be WAITING_FOR_PAYMENT.`,
        };
      }
      break;

    case "cancel":
      // Can cancel from any state except COMPLETED
      if (status === "COMPLETED") {
        return {
          valid: false,
          error: "Cannot cancel a completed job.",
        };
      }
      break;
  }

  return { valid: true };
}

/**
 * Check if job can be re-circulated
 */
export function canReCirculateJob(
  status: JobStatus,
  reCirculationCount: number = 0
): { canReCirculate: boolean; error?: string } {
  // Maximum re-circulation attempts (prevent infinite loops)
  const MAX_RE_CIRCULATIONS = 5;

  if (reCirculationCount >= MAX_RE_CIRCULATIONS) {
    return {
      canReCirculate: false,
      error: `Job has been re-circulated ${reCirculationCount} times. Maximum limit reached.`,
    };
  }

  // Can re-circulate from these states
  const reCirculatableStates: JobStatus[] = [
    "PENDING",
    "NEGOTIATION_PENDING",
    "WAITING_FOR_PAYMENT",
  ];

  if (!reCirculatableStates.includes(status)) {
    return {
      canReCirculate: false,
      error: `Cannot re-circulate job from ${status} state.`,
    };
  }

  return { canReCirculate: true };
}

