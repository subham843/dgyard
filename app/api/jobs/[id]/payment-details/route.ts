/**
 * Job Payment Details API
 * 
 * Get complete payment information for a job including:
 * - Payment split details
 * - Warranty hold information
 * - Ledger entries
 * - Available for withdrawal amount
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLedgerAccountBalance, getJobLedgerEntries, LedgerAccountType } from "@/lib/services/ledger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;

    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        payments: true,
        warrantyHolds: true,
        technician: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isDealer = user.role === "DEALER" && job.dealerId === user.id;
    const isTechnician = user.role === "TECHNICIAN" && job.assignedTechnicianId && job.technician?.user?.id === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isDealer && !isTechnician && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized to view this job's payment details" },
        { status: 403 }
      );
    }

    const payment = job.payments.find((p) => p.paymentType === "SERVICE_PAYMENT");
    const warrantyHold = job.warrantyHolds.find(
      (w) => w.status === "LOCKED" || w.status === "FROZEN" || w.status === "RELEASED"
    );

    // Get ledger entries for this job
    const ledgerEntries = await getJobLedgerEntries(jobId);

    // Get available balance for technician (if technician is viewing)
    let availableBalance = 0;
    if (isTechnician && job.technician?.user) {
      availableBalance = await getLedgerAccountBalance(
        jobId,
        job.technician.user.id,
        LedgerAccountType.TECHNICIAN_PAYABLE
      );
    }

    // Calculate payment breakdown
    let paymentBreakdown = null;
    if (payment) {
      paymentBreakdown = {
        totalAmount: payment.totalAmount || payment.amount || 0,
        immediateAmount: payment.immediateAmount || payment.amount || 0,
        warrantyHoldAmount: payment.warrantyHoldAmount || 0,
        holdPercentage: payment.holdPercentage || 0,
        commissionRate: payment.commissionRate || 0,
        commissionAmount: payment.commissionAmount || 0,
        netAmount: payment.netAmount || 0,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        isCashPayment: payment.isCashPayment,
        paidAt: payment.paidAt?.toISOString(),
      };
    }

    // Warranty hold details
    let warrantyHoldDetails = null;
    if (warrantyHold) {
      warrantyHoldDetails = {
        id: warrantyHold.id,
        holdAmount: warrantyHold.holdAmount,
        holdPercentage: warrantyHold.holdPercentage,
        warrantyDays: warrantyHold.warrantyDays,
        startDate: warrantyHold.startDate.toISOString(),
        endDate: warrantyHold.endDate.toISOString(),
        effectiveEndDate: warrantyHold.effectiveEndDate.toISOString(),
        status: warrantyHold.status,
        isFrozen: warrantyHold.isFrozen,
        frozenAt: warrantyHold.frozenAt?.toISOString(),
        freezeReason: warrantyHold.freezeReason,
        releasedAt: warrantyHold.releasedAt?.toISOString(),
        releaseReason: warrantyHold.releaseReason,
        daysRemaining: Math.max(0, Math.ceil((new Date(warrantyHold.effectiveEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      };
    }

    return NextResponse.json({
      job: {
        id: job.id,
        jobNumber: job.jobNumber,
        title: job.title,
        status: job.status,
      },
      payment: paymentBreakdown,
      warrantyHold: warrantyHoldDetails,
      availableBalance,
      ledgerEntries: ledgerEntries.map((entry) => ({
        id: entry.id,
        entryType: entry.entryType,
        amount: entry.amount,
        category: entry.category,
        description: entry.description,
        accountType: entry.account.accountType,
        createdAt: entry.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error("Error fetching payment details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payment details" },
      { status: 500 }
    );
  }
}





