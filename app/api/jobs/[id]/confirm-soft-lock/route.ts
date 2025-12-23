import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { validateStateTransition } from "@/lib/services/job-state-validator";

/**
 * Dealer confirms the soft lock and transitions job to WAITING_FOR_PAYMENT
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.jobPost.findUnique({
      where: { id },
      include: {
        dealer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Only dealer can confirm soft lock
    if (job.dealerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Only confirm if job is SOFT_LOCKED
    if (job.status !== JobStatus.SOFT_LOCKED) {
      return NextResponse.json(
        { error: "Job is not in SOFT_LOCKED state" },
        { status: 400 }
      );
    }

    // Validate state transition
    const transitionValidation = validateStateTransition(
      job.status,
      JobStatus.WAITING_FOR_PAYMENT,
      session.user.role as any
    );
    if (!transitionValidation.isValid) {
      return NextResponse.json(
        { error: transitionValidation.error },
        { status: 400 }
      );
    }

    // Set payment deadline (30 minutes from now)
    const paymentDeadlineAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Transition to WAITING_FOR_PAYMENT
    const updatedJob = await prisma.jobPost.update({
      where: { id },
      data: {
        status: JobStatus.WAITING_FOR_PAYMENT,
        assignedAt: new Date(),
        priceLocked: true, // Lock price now
        paymentDeadlineExpiresAt: paymentDeadlineAt,
        // Clear soft lock fields
        softLockedAt: null,
        softLockExpiresAt: null,
        softLockedByTechnicianId: null,
      },
    });

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: "Soft lock confirmed. Please proceed with payment.",
    });
  } catch (error: any) {
    console.error("Error confirming soft lock:", error);
    return NextResponse.json(
      { error: error.message || "Failed to confirm soft lock" },
      { status: 500 }
    );
  }
}

