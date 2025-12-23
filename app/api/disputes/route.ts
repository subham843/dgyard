import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";

// POST - Create a new dispute
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { jobId, type, title, description, evidenceUrls } = data;

    if (!jobId || !type || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify job exists and user has permission
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        dealer: true,
        technician: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if user is dealer, technician, or customer
    let raisedByRole = "CUSTOMER";
    if (session.user.role === "DEALER" && job.dealerId === session.user.id) {
      raisedByRole = "DEALER";
    } else if (session.user.role === "TECHNICIAN" && job.assignedTechnicianId) {
      const technician = await prisma.technician.findUnique({
        where: { userId: session.user.id },
      });
      if (technician && technician.id === job.assignedTechnicianId) {
        raisedByRole = "TECHNICIAN";
      }
    }

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        jobId,
        raisedBy: session.user.id,
        raisedByRole,
        type,
        title,
        description,
        evidenceUrls: evidenceUrls || [],
        status: "OPEN",
      },
      include: {
        job: {
          select: {
            jobNumber: true,
            title: true,
          },
        },
      },
    });

    // Notify admin about new dispute
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
    });

    for (const admin of admins) {
      await sendNotification({
        userId: admin.id,
        jobId,
        type: "DISPUTE_RAISED",
        title: "New Dispute Raised",
        message: `A new dispute has been raised for job ${job.jobNumber} by ${raisedByRole}. Type: ${type}`,
        channels: ["IN_APP", "EMAIL"],
        metadata: {
          disputeId: dispute.id,
          disputeType: type,
          raisedBy: raisedByRole,
        },
      });
    }

    // Notify other parties
    if (raisedByRole === "DEALER" && job.technician?.user) {
      await sendNotification({
        userId: job.technician.user.id,
        jobId,
        type: "DISPUTE_RAISED",
        title: "Dispute Raised",
        message: `A dispute has been raised for job ${job.jobNumber}. Please review.`,
        channels: ["IN_APP", "EMAIL"],
      });
    } else if (raisedByRole === "TECHNICIAN" && job.dealer) {
      await sendNotification({
        userId: job.dealer.userId,
        jobId,
        type: "DISPUTE_RAISED",
        title: "Dispute Raised",
        message: `A dispute has been raised for job ${job.jobNumber}. Please review.`,
        channels: ["IN_APP", "EMAIL"],
      });
    }

    return NextResponse.json({ success: true, dispute });
  } catch (error: any) {
    console.error("Error creating dispute:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create dispute" },
      { status: 500 }
    );
  }
}

// GET - Fetch disputes for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    let where: any = {};

    if (session.user.role === "DEALER") {
      where.job = {
        dealerId: session.user.id,
      };
    } else if (session.user.role === "TECHNICIAN") {
      const technician = await prisma.technician.findUnique({
        where: { userId: session.user.id },
      });
      if (technician) {
        where.job = {
          assignedTechnicianId: technician.id,
        };
      }
    } else if (session.user.role === "ADMIN") {
      // Admin can see all disputes
    } else {
      where.raisedBy = session.user.id;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ disputes });
  } catch (error: any) {
    console.error("Error fetching disputes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch disputes" },
      { status: 500 }
    );
  }
}






