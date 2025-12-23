import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

/**
 * Reset soft lock timer when dealer views the job
 * This ensures the 45-second timer starts from when the page loads, not from when technician accepted
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

    // Only dealer can reset soft lock timer
    if (job.dealerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Only reset if job is SOFT_LOCKED
    if (job.status !== JobStatus.SOFT_LOCKED) {
      return NextResponse.json(
        { error: "Job is not in SOFT_LOCKED state" },
        { status: 400 }
      );
    }

    // Reset soft lock timer to start from now (45 seconds from page load)
    const softLockDuration = 45 * 1000; // 45 seconds
    const newSoftLockExpiresAt = new Date(Date.now() + softLockDuration);

    const updatedJob = await prisma.jobPost.update({
      where: { id },
      data: {
        softLockExpiresAt: newSoftLockExpiresAt,
        softLockedAt: new Date(), // Update soft lock start time
      },
    });

    return NextResponse.json({
      success: true,
      softLockExpiresAt: updatedJob.softLockExpiresAt,
      message: "Soft lock timer reset successfully",
    });
  } catch (error: any) {
    console.error("Error resetting soft lock timer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset soft lock timer" },
      { status: 500 }
    );
  }
}

