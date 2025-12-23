import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Technician profile not found" },
        { status: 404 }
      );
    }

    // Get all job payments
    let jobPayments = [];
    try {
      jobPayments = await prisma.jobPayment.findMany({
        where: { technicianId: technician.id },
        include: {
          job: {
            select: {
              id: true,
              jobNumber: true,
              title: true,
              warrantyDays: true,
              warrantyStartDate: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      console.log(`Found ${jobPayments.length} job payments for technician ${technician.id}`);
    if (jobPayments.length > 0) {
      console.log("Payment statuses:", jobPayments.map(p => ({ 
        id: p.id, 
        status: p.status, 
        immediateAmount: p.immediateAmount,
        warrantyHoldAmount: p.warrantyHoldAmount,
        totalAmount: p.totalAmount
      })));
    }
    } catch (error: any) {
      console.error("Error fetching job payments:", error);
      throw new Error(`Failed to fetch job payments: ${error?.message || "Unknown error"}`);
    }

    // Get warranty holds for this technician
    let warrantyHolds = [];
    try {
      warrantyHolds = await prisma.warrantyHold.findMany({
        where: { technicianId: technician.id },
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
      console.log(`Found ${warrantyHolds.length} warranty holds for technician ${technician.id}`);
    } catch (error: any) {
      console.error("Error fetching warranty holds:", error);
      // Don't throw, just log - warranty holds are optional
      warrantyHolds = [];
    }

    // Calculate totals - use correct field names from schema
    // JobPaymentStatus: PENDING, ESCROW_HOLD, COMMISSION_DEDUCTED, RELEASED, REFUNDED
    const lifetimeEarnings = jobPayments.reduce((sum, p) => {
      const amount = Number(p.totalAmount) || Number(p.amount) || 0;
      return sum + amount;
    }, 0);
    
    // Paid amount = RELEASED status (payment has been released to technician)
    const paidAmount = jobPayments
      .filter(p => p.status === "RELEASED" || p.status === "COMMISSION_DEDUCTED")
      .reduce((sum, p) => {
        const amount = Number(p.immediateAmount) || Number(p.amount) || 0;
        return sum + amount;
      }, 0);
    
    // Pending amount = Total amount (immediate + warranty hold) for PENDING or ESCROW_HOLD status
    // This represents the full payment that's not yet released
    const pendingAmount = jobPayments
      .filter(p => p.status === "PENDING" || p.status === "ESCROW_HOLD")
      .reduce((sum, p) => {
        // For pending payments, include both immediate and warranty hold amounts
        const immediate = Number(p.immediateAmount) || Number(p.amount) || 0;
        const warrantyHold = Number(p.warrantyHoldAmount) || 0;
        const total = Number(p.totalAmount) || (immediate + warrantyHold);
        return sum + total;
      }, 0);
    
    // Locked amount = warranty hold amount that's currently being held
    // Include all warranty hold amounts from payments (check if warranty period is still active)
    // Plus warranty holds from WarrantyHold table
    const lockedAmount = jobPayments.reduce((sum, p) => {
      const warrantyHold = Number(p.warrantyHoldAmount) || 0;
      if (warrantyHold === 0) return sum;
      
      // Check if warranty period is still active
      let isWarrantyActive = false;
      
      if (p.warrantyHoldReleaseDate) {
        // Use warranty hold release date
        const releaseDate = new Date(p.warrantyHoldReleaseDate);
        isWarrantyActive = releaseDate > new Date();
      } else if (p.job?.warrantyStartDate && p.job?.warrantyDays) {
        // Calculate from warranty start date and days
        const warrantyEnd = new Date(
          new Date(p.job.warrantyStartDate).getTime() + 
          p.job.warrantyDays * 24 * 60 * 60 * 1000
        );
        isWarrantyActive = warrantyEnd > new Date();
      } else if (p.status === "PENDING" || p.status === "ESCROW_HOLD") {
        // If payment is pending, warranty is definitely active
        isWarrantyActive = true;
      } else {
        // Default: if no warranty info, assume it's active if payment is not RELEASED
        isWarrantyActive = p.status !== "RELEASED" && p.status !== "REFUNDED";
      }
      
      return isWarrantyActive ? sum + warrantyHold : sum;
    }, 0) + warrantyHolds.reduce((sum, wh) => {
      // Only include active warranty holds (not released)
      if (wh.status === "LOCKED" || wh.status === "FROZEN") {
        const amount = Number(wh.holdAmount) || 0;
        return sum + amount;
      }
      return sum;
    }, 0);
    
    const penalties = jobPayments.reduce((sum, p) => {
      const amount = Number(p.commissionAmount) || 0;
      return sum + amount;
    }, 0);

    // Format job payments
    const formattedPayments = jobPayments.map((payment) => {
      // Use warrantyHoldReleaseDate if available, otherwise calculate from warrantyStartDate and warrantyDays
      let warrantyEndDate: Date | undefined = undefined;
      
      if (payment.warrantyHoldReleaseDate) {
        warrantyEndDate = payment.warrantyHoldReleaseDate;
      } else if (payment.job?.warrantyStartDate && payment.job?.warrantyDays) {
        warrantyEndDate = new Date(
          new Date(payment.job.warrantyStartDate).getTime() + 
          payment.job.warrantyDays * 24 * 60 * 60 * 1000
        );
      } else if (payment.createdAt && payment.job?.warrantyDays) {
        warrantyEndDate = new Date(
          new Date(payment.createdAt).getTime() + 
          payment.job.warrantyDays * 24 * 60 * 60 * 1000
        );
      }

      // Calculate correct amounts
      const totalAmount = Number(payment.totalAmount) || 0;
      const immediateAmount = Number(payment.immediateAmount) || 0;
      const warrantyHoldAmount = Number(payment.warrantyHoldAmount) || 0;
      
      // If totalAmount is 0 but we have immediateAmount and warrantyHoldAmount, calculate total
      const calculatedTotal = totalAmount || (immediateAmount + warrantyHoldAmount);
      
      // If immediateAmount is 0 but we have totalAmount and warrantyHoldAmount, calculate immediate
      const calculatedImmediate = immediateAmount || (calculatedTotal - warrantyHoldAmount);

      return {
        id: payment.id,
        jobNumber: payment.job?.jobNumber || "N/A",
        jobTitle: payment.job?.title || "N/A",
        amount: calculatedTotal,
        immediatePayment: calculatedImmediate,
        holdAmount: warrantyHoldAmount,
        status: payment.status || "PENDING",
        warrantyEndDate: warrantyEndDate?.toISOString(),
        createdAt: payment.createdAt?.toISOString() || new Date().toISOString(),
        commissionAmount: Number(payment.commissionAmount) || 0,
        netAmount: Number(payment.netAmount) || calculatedImmediate,
      };
    });

    const response = {
      lifetimeEarnings,
      paidAmount,
      pendingAmount,
      lockedAmount,
      penalties,
      jobPayments: formattedPayments,
    };

    console.log("Earnings calculations:", {
      lifetimeEarnings,
      paidAmount,
      pendingAmount,
      lockedAmount,
      penalties,
      jobPaymentsCount: formattedPayments.length,
      paymentBreakdown: formattedPayments.map(p => ({
        jobNumber: p.jobNumber,
        status: p.status,
        amount: p.amount,
        immediatePayment: p.immediatePayment,
        holdAmount: p.holdAmount,
      })),
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error fetching earnings:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { 
        error: "Failed to fetch earnings",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
