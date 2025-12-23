import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const job = await prisma.jobPost.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.assignedTechnicianId !== technician.id) {
      return NextResponse.json(
        { error: "You are not assigned to this job" },
        { status: 403 }
      );
    }

    const { response } = await request.json();

    if (!response || !response.trim()) {
      return NextResponse.json(
        { error: "Response is required" },
        { status: 400 }
      );
    }

    // Find the dispute for this job
    const dispute = await prisma.dispute.findFirst({
      where: {
        jobId: params.id,
        status: { in: ["OPEN", "UNDER_REVIEW"] },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: "Dispute not found for this job" },
        { status: 404 }
      );
    }

    // Update dispute with technician response
    // Note: We'll add a response field or use resolutionNotes for now
    await prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        resolutionNotes: response, // Using resolutionNotes to store technician response
        status: "UNDER_REVIEW",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Dispute response submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting dispute response:", error);
    return NextResponse.json(
      { error: "Failed to submit dispute response" },
      { status: 500 }
    );
  }
}

