/**
 * Job Privacy Service
 * 
 * Controls what information is visible to technicians and dealers
 * based on payment status. Before payment is locked, limited information
 * is shown to protect privacy.
 */

import { prisma } from "@/lib/prisma";
import { JobPaymentStatus } from "@prisma/client";

/**
 * Check if payment is locked for a job (i.e., dealer has paid)
 * Payment is considered locked if JobPayment status is ESCROW_HOLD or RELEASED
 */
export async function isPaymentLocked(jobId: string): Promise<boolean> {
  try {
    const payment = await prisma.jobPayment.findFirst({
      where: {
        jobId,
        status: {
          in: [JobPaymentStatus.ESCROW_HOLD, JobPaymentStatus.RELEASED],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return !!payment;
  } catch (error) {
    console.error("Error checking payment lock status:", error);
    // Default to false (not locked) if there's an error
    return false;
  }
}

/**
 * Filter dealer information for technician view
 * Before payment: Show only business name, trust score, rating
 * After payment: Show all information
 */
export function filterDealerInfoForTechnician(
  dealer: any,
  paymentLocked: boolean
): {
  businessName?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  trustScore?: number;
  rating?: number;
} {
  if (paymentLocked) {
    // After payment: Show all information
    return {
      businessName: dealer?.dealer?.businessName || dealer?.name,
      name: dealer?.name,
      fullName: dealer?.dealer?.fullName,
      email: dealer?.email,
      phone: dealer?.phone,
      trustScore: dealer?.dealer?.trustScore || dealer?.trustScore,
      rating: dealer?.dealer?.rating || dealer?.rating,
    };
  } else {
    // Before payment: Show only trust score and rating (NO dealer name/contact info)
    return {
      // Don't include businessName, name, fullName, email, phone before payment
      trustScore: dealer?.dealer?.trustScore || dealer?.trustScore,
      rating: dealer?.dealer?.rating || dealer?.rating,
    };
  }
}

/**
 * Filter technician information for dealer view
 * Before payment: Show only name and service location
 * After payment: Show all information
 */
export function filterTechnicianInfoForDealer(
  technician: any,
  paymentLocked: boolean
): {
  fullName?: string;
  email?: string;
  mobile?: string;
  skills?: any;
  serviceArea?: any;
  trustScore?: number;
  rating?: number;
} | null {
  if (paymentLocked) {
    // After payment: Show all information
    return {
      fullName: technician?.fullName,
      email: technician?.email,
      mobile: technician?.mobile,
      skills: technician?.primarySkills,
      serviceArea: {
        latitude: technician?.latitude,
        longitude: technician?.longitude,
        placeName: technician?.placeName,
        serviceRadiusKm: technician?.serviceRadiusKm,
      },
      trustScore: technician?.trustScore,
      rating: technician?.rating,
    };
  } else {
    // Before payment: Show name, service location, and rating (for bid evaluation)
    // But NOT contact details (email, mobile)
    return {
      fullName: technician?.fullName,
      rating: technician?.rating,
      serviceArea: {
        placeName: technician?.placeName,
        serviceRadiusKm: technician?.serviceRadiusKm,
      },
    };
  }
}

