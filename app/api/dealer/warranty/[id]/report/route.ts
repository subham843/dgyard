import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "DEALER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { description } = await request.json();

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const warranty = await prisma.warranty.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            technician: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!warranty) {
      return NextResponse.json({ error: "Warranty not found" }, { status: 404 });
    }

    if (warranty.job.dealerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedWarranty = await prisma.warranty.update({
      where: { id },
      data: {
        status: "ISSUE_REPORTED",
        issueReportedAt: new Date(),
        issueDescription: description,
        reportedBy: "DEALER",
        reworkAssignedTo: warranty.job.assignedTechnicianId, // Assign to same technician
      },
    });

    // Notify technician about warranty issue
    if (warranty.job.technician?.user) {
      await sendNotification({
        userId: warranty.job.technician.user.id,
        jobId: warranty.job.id,
        type: "WARRANTY_ISSUE_REPORTED",
        title: "Warranty Issue Reported",
        message: `A warranty issue has been reported for job ${warranty.job.jobNumber}. Please review and address the issue.`,
        channels: ["IN_APP", "EMAIL"],
      });
    }

    return NextResponse.json({ warranty: updatedWarranty });
  } catch (error: any) {
    console.error("Error reporting warranty issue:", error);
    return NextResponse.json(
      { error: error.message || "Failed to report warranty issue" },
      { status: 500 }
    );
  }
}






