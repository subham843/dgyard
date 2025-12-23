/**
 * Payment Split API
 * 
 * Handles payment split creation when job is completed and approved
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentSplit } from "@/lib/services/payment-split";
import { applyAutoRules } from "@/lib/services/ai-automation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;
    const data = await request.json();

    // Only dealers or admins can create payment split (after job approval)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.role !== "DEALER" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Only dealers or admins can create payment splits" },
        { status: 403 }
      );
    }

    // Get job details
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        technician: true,
        dealer: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!job.assignedTechnicianId) {
      return NextResponse.json(
        { error: "Job has no assigned technician" },
        { status: 400 }
      );
    }

    // Job must be completed or pending approval
    if (job.status !== "COMPLETED" && job.status !== "COMPLETION_PENDING_APPROVAL") {
      return NextResponse.json(
        { error: "Job must be completed or pending approval" },
        { status: 400 }
      );
    }

    // Check if payment already exists
    const existingPayment = await prisma.jobPayment.findFirst({
      where: { jobId },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "Payment split already exists for this job" },
        { status: 400 }
      );
    }

    // Get job amount (from finalPrice or estimatedCost)
    const totalAmount = data.totalAmount || job.finalPrice || job.estimatedCost || 0;
    
    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: "Job amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Get hold percentage (from request or use AI recommendation)
    let holdPercentage = data.holdPercentage || 20; // Default 20%
    // Use warrantyDays from job (set from service category/subcategory) or from request, default to 30
    const warrantyDays = job.warrantyDays || data.warrantyDays || 30;

    // If not specified, get AI recommendation
    if (!data.holdPercentage && job.assignedTechnicianId) {
      const autoRules = await applyAutoRules(jobId, job.assignedTechnicianId, job.dealerId);
      holdPercentage = autoRules.holdPercentage;
    }

    // Create payment split
    const splitResult = await createPaymentSplit({
      jobId,
      totalAmount,
      holdPercentage,
      warrantyDays,
      technicianId: job.assignedTechnicianId,
      dealerId: job.dealerId,
      commissionRate: data.commissionRate || 5, // Default 5%
      paymentMethod: data.paymentMethod || "ONLINE",
      cashProofUrl: data.cashProofUrl,
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      createdBy: user.role === "ADMIN" ? user.id : undefined,
    });

    // Update job payment status
    await prisma.jobPayment.update({
      where: { id: splitResult.paymentId },
      data: {
        status: "ESCROW_HOLD",
      },
    });

    return NextResponse.json({
      success: true,
      paymentSplit: splitResult,
      message: "Payment split created successfully",
    });
  } catch (error: any) {
    console.error("Error creating payment split:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment split" },
      { status: 500 }
    );
  }
}

/**
 * Get payment split details for a job
 */
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

    const payment = await prisma.jobPayment.findFirst({
      where: { jobId },
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

    if (!payment) {
      return NextResponse.json(
        { error: "Payment split not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ paymentSplit: payment });
  } catch (error: any) {
    console.error("Error fetching payment split:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payment split" },
      { status: 500 }
    );
  }
}




