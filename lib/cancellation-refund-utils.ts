/**
 * Universal Cancellation & Refund Eligibility Utilities
 * Payment-gateway independent logic
 */

export enum RefundStatus {
  NONE = "NONE",
  REQUESTED = "REQUESTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
}

export interface CancellationEligibility {
  eligible: boolean;
  reason?: string;
  timeRemaining?: number; // milliseconds remaining
}

export interface RefundEligibility {
  eligible: boolean;
  reason?: string;
  timeRemaining?: number; // milliseconds remaining
}

/**
 * Check if an order/service can be cancelled
 * Rules:
 * - Must be within 24 hours of order placement
 * - Technician must not be assigned
 * - Work must not have started
 * - Order must not be shipped (for products)
 */
export function checkCancellationEligibility(
  orderPlacedAt: Date | string,
  technicianAssignedAt: Date | string | null | undefined,
  workStartedAt: Date | string | null | undefined,
  status: string,
  deliveryAt?: Date | string | null
): CancellationEligibility {
  // Convert to Date objects if strings
  const orderDate = orderPlacedAt instanceof Date ? orderPlacedAt : new Date(orderPlacedAt);
  const techDate = technicianAssignedAt 
    ? (technicianAssignedAt instanceof Date ? technicianAssignedAt : new Date(technicianAssignedAt))
    : null;
  const workDate = workStartedAt
    ? (workStartedAt instanceof Date ? workStartedAt : new Date(workStartedAt))
    : null;
  const now = new Date();
  const timeSinceOrder = now.getTime() - orderDate.getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Check if 24 hours have passed
  if (timeSinceOrder > twentyFourHours) {
    return {
      eligible: false,
      reason: "Cancellation is only allowed within 24 hours of placing the order.",
    };
  }

  // Check if technician is assigned
  if (techDate) {
    return {
      eligible: false,
      reason: "Cancellation is not allowed as a technician has already been assigned.",
    };
  }

  // Check if work has started
  if (workDate) {
    return {
      eligible: false,
      reason: "Cancellation is not allowed as service work has already started.",
    };
  }

  // Check if order is shipped (for product orders)
  if (status === "SHIPPED" || status === "DELIVERED") {
    return {
      eligible: false,
      reason: "Cancellation is not allowed as the order has already been shipped.",
    };
  }

  // Check if already cancelled
  if (status === "CANCELLED") {
    return {
      eligible: false,
      reason: "This order has already been cancelled.",
    };
  }

  const timeRemaining = twentyFourHours - timeSinceOrder;

  return {
    eligible: true,
    timeRemaining,
  };
}

/**
 * Check if a refund can be requested
 * Rules:
 * - Must be within 48 hours of cancellation approval, OR
 * - Must be within 24 hours of delivery (for damaged/incorrect products)
 */
export function checkRefundEligibility(
  cancelApprovedAt: Date | string | null | undefined,
  deliveryAt: Date | string | null | undefined,
  damagedProductReportedAt: Date | string | null | undefined,
  refundStatus: string
): RefundEligibility {
  const now = new Date();
  
  // Convert to Date objects if strings
  const cancelDate = cancelApprovedAt
    ? (cancelApprovedAt instanceof Date ? cancelApprovedAt : new Date(cancelApprovedAt))
    : null;
  const deliveryDate = deliveryAt
    ? (deliveryAt instanceof Date ? deliveryAt : new Date(deliveryAt))
    : null;
  const damagedDate = damagedProductReportedAt
    ? (damagedProductReportedAt instanceof Date ? damagedProductReportedAt : new Date(damagedProductReportedAt))
    : null;

  // Check if already refunded
  if (refundStatus === "COMPLETED") {
    return {
      eligible: false,
      reason: "Refund has already been processed.",
    };
  }

  // Check if refund was rejected
  if (refundStatus === "REJECTED") {
    return {
      eligible: false,
      reason: "Refund request has been rejected. Please contact support for assistance.",
    };
  }

  // Check if refund is already requested/approved/processing
  if (refundStatus && refundStatus !== "NONE") {
    return {
      eligible: false,
      reason: "A refund request is already in progress.",
    };
  }

  // Case 1: Refund after cancellation
  if (cancelDate) {
    const timeSinceCancellation = now.getTime() - cancelDate.getTime();
    const fortyEightHours = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

    if (timeSinceCancellation > fortyEightHours) {
      return {
        eligible: false,
        reason: "Refund request must be raised within 48 hours of cancellation confirmation.",
      };
    }

    const timeRemaining = fortyEightHours - timeSinceCancellation;
    return {
      eligible: true,
      timeRemaining,
    };
  }

  // Case 2: Refund for damaged/incorrect product (already reported)
  if (deliveryDate && damagedDate) {
    const timeSinceReport = now.getTime() - damagedDate.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (timeSinceReport > twentyFourHours) {
      return {
        eligible: false,
        reason: "Damaged/incorrect product issues must be reported within 24 hours of delivery.",
      };
    }

    const timeRemaining = twentyFourHours - timeSinceReport;
    return {
      eligible: true,
      timeRemaining,
    };
  }

  // Case 3: Order delivered - can report damaged product within 24 hours
  if (deliveryDate && !damagedDate) {
    const timeSinceDelivery = now.getTime() - deliveryDate.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (timeSinceDelivery <= twentyFourHours) {
      return {
        eligible: true,
        timeRemaining: twentyFourHours - timeSinceDelivery,
      };
    } else {
      return {
        eligible: false,
        reason: "Damaged/incorrect product issues must be reported within 24 hours of delivery.",
      };
    }
  }

  return {
    eligible: false,
    reason: "Refund is only available after cancellation or for damaged/incorrect products reported within 24 hours of delivery.",
  };
}

/**
 * Format time remaining in human-readable format
 */
export function formatTimeRemaining(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
  return `${minutes} minute${minutes > 1 ? "s" : ""}`;
}

/**
 * Calculate refund processing time (5-7 working days)
 */
export function getRefundProcessingTime(): string {
  return "5–7 working days";
}

/**
 * Check if order/service is eligible for refund based on status
 */
export function canRequestRefund(
  status: string,
  paymentStatus: string,
  cancelApprovedAt: Date | null | undefined
): boolean {
  // Must be cancelled, delivered (for damaged products), or have payment
  if (status !== "CANCELLED" && status !== "DELIVERED" && paymentStatus !== "PAID") {
    return false;
  }

  // If cancelled, must have cancellation approval (or at least cancellation requested)
  if (status === "CANCELLED" && !cancelApprovedAt) {
    // Allow refund request even if cancellation is pending approval
    // The eligibility check will handle the timing
    return true;
  }

  // If delivered, must have payment
  if (status === "DELIVERED" && paymentStatus !== "PAID") {
    return false;
  }

  return true;
}

