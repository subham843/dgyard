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

    // Get disputes for jobs assigned to this technician
    const disputes = await prisma.dispute.findMany({
      where: {
        job: {
          assignedTechnicianId: technician.id,
        },
      },
      include: {
        job: {
          include: {
            dealer: {
              include: {
                dealer: {
                  select: {
                    businessName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to match frontend interface
    const disputedJobs = disputes.map((dispute) => ({
      id: dispute.job.id,
      jobNumber: dispute.job.jobNumber,
      title: dispute.job.title,
      description: dispute.job.description,
      disputeReason: dispute.title,
      disputeStatus: dispute.status,
      disputeDetails: dispute.description,
      location: {
        city: dispute.job.city || "",
        state: dispute.job.state || "",
      },
      dealer: {
        businessName: dispute.job.dealer?.dealer?.businessName || "N/A",
      },
      amount: dispute.job.finalPrice || 0,
      createdAt: dispute.createdAt.toISOString(),
      disputeId: dispute.id,
      disputeType: dispute.type,
      raisedBy: dispute.raisedByRole,
    }));

    return NextResponse.json({
      jobs: disputedJobs,
      total: disputedJobs.length,
    });
  } catch (error) {
    console.error("Error fetching disputed jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch disputed jobs" },
      { status: 500 }
    );
  }
}




