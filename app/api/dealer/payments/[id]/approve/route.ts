/**
 * Approve/Release Payment API
 * 
 * Dealer can approve pending payments to release funds to technician
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogAction } from "@prisma/client";
import { createAuditLog } from "@/lib/services/audit-log";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: paymentId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "DEALER") {
      return NextResponse.json(
        { error: "Only dealers can approve payments" },
        { status: 403 }
      );
    }

    // Get payment details
    const payment = await prisma.jobPayment.findUnique({
      where: { id: paymentId },
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
          },
        },
        dealer: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify payment belongs to dealer
    if (payment.dealerId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to approve this payment" },
        { status: 403 }
      );
    }

    // Check if payment can be approved
    if (payment.status !== "PENDING" && payment.status !== "ESCROW_HOLD") {
      return NextResponse.json(
        { error: `Payment cannot be approved. Current status: ${payment.status}` },
        { status: 400 }
      );
    }

    // Update payment status to RELEASED
    const updatedPayment = await prisma.jobPayment.update({
      where: { id: paymentId },
      data: {
        status: "RELEASED",
        releasedAt: new Date(),
      },
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

    // Create audit log
    await createAuditLog({
      jobId: payment.jobId,
      userId: session.user.id,
      userRole: "DEALER",
      action: AuditLogAction.PAYMENT_SPLIT,
      description: `Payment approved and released: ₹${updatedPayment.netAmount || updatedPayment.amount} for job ${payment.job?.jobNumber}`,
      amount: updatedPayment.netAmount || updatedPayment.amount,
      paymentId: paymentId,
      metadata: {
        previousStatus: payment.status,
        newStatus: "RELEASED",
        paymentType: payment.paymentType,
      },
    });

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: "Payment approved and released successfully",
    });
  } catch (error: any) {
    console.error("Error approving payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve payment" },
      { status: 500 }
    );
  }
}

