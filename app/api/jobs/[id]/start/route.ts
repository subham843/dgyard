import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";
import { validateJobStateForOperation, validateStateTransition } from "@/lib/services/job-state-validator";

/**
 * Start Job API
 * 
 * When technician starts a job:
 * 1. Job status changes from ASSIGNED to IN_PROGRESS
 * 2. Notifications are sent to dealer
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

    const { id: jobId } = await params;

    // Get technician profile
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

    // Get job details
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        dealer: {
          include: {
            dealer: {
              select: {
                id: true,
                userId: true,
                businessName: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify job is assigned to this technician
    if (job.assignedTechnicianId !== technician.id) {
      return NextResponse.json(
        { error: "Unauthorized to start this job" },
        { status: 403 }
      );
    }

    // Validate state for start operation
    const stateValidation = validateJobStateForOperation(job.status, "start");
    if (!stateValidation.valid) {
      return NextResponse.json({ error: stateValidation.error }, { status: 400 });
    }

    // Validate state transition
    const transitionValidation = validateStateTransition(job.status, "IN_PROGRESS");
    if (!transitionValidation.valid) {
      return NextResponse.json({ error: transitionValidation.error }, { status: 400 });
    }

    // Update job status to IN_PROGRESS
    const updatedJob = await prisma.jobPost.update({
      where: { id: jobId },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    // Notify dealer
    if (job.dealer?.dealer?.userId) {
      await sendNotification({
        userId: job.dealer.dealer.userId,
        jobId: jobId,
        type: "JOB_STARTED",
        title: "Job Started",
        message: `Technician has started working on job ${job.jobNumber}.`,
        channels: ["IN_APP", "EMAIL", "WHATSAPP"],
        metadata: { jobNumber: job.jobNumber },
      });
    }

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: "Job started successfully",
    });
  } catch (error: any) {
    console.error("Error starting job:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start job" },
      { status: 500 }
    );
  }
}


